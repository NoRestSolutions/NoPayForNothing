package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/spruceid/siwe-go"
	"github.com/securemarket/backend/internal/database"
	"github.com/securemarket/backend/internal/middleware"
	"github.com/securemarket/backend/internal/models"
)

type nonceEntry struct {
	address   string
	expiresAt time.Time
}

type AuthHandler struct {
	JWTSecret   string
	FrontendURL string
	nonces      map[string]nonceEntry
	nonceMutex  sync.RWMutex
}

func NewAuthHandler(jwtSecret, frontendURL string) *AuthHandler {
	h := &AuthHandler{
		JWTSecret:   jwtSecret,
		FrontendURL: frontendURL,
		nonces:      make(map[string]nonceEntry),
	}
	// Start background cleanup of expired nonces
	go h.cleanupExpiredNonces()
	return h
}

func (h *AuthHandler) cleanupExpiredNonces() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		h.nonceMutex.Lock()
		now := time.Now()
		for n, entry := range h.nonces {
			if now.After(entry.expiresAt) {
				delete(h.nonces, n)
			}
		}
		h.nonceMutex.Unlock()
	}
}

func (h *AuthHandler) Routes(r chi.Router) {
	r.Get("/nonce", h.HandleNonce)
	r.Post("/siwe", h.HandleSIWE)
	r.Get("/me", h.HandleMe)
	r.Put("/role", h.HandleUpdateRole)
}

func (h *AuthHandler) extractUserID(r *http.Request) string {
	if id := middleware.GetUserID(r); id != "" {
		return id
	}
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return ""
	}
	claims := &middleware.Claims{}
	token, err := jwt.ParseWithClaims(parts[1], claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return ""
	}
	return claims.UserID
}

func (h *AuthHandler) HandleNonce(w http.ResponseWriter, r *http.Request) {
	address := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("address")))

	// Generate 16-byte random hex nonce
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		http.Error(w, `{"error":"failed to generate nonce"}`, http.StatusInternalServerError)
		return
	}
	nonce := hex.EncodeToString(bytes)

	// Save nonce with 5 minute expiration
	h.nonceMutex.Lock()
	h.nonces[nonce] = nonceEntry{
		address:   address,
		expiresAt: time.Now().Add(5 * time.Minute),
	}
	h.nonceMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"nonce": nonce,
	})
}

func (h *AuthHandler) HandleSIWE(w http.ResponseWriter, r *http.Request) {
	var req models.AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Message == "" || req.Signature == "" {
		http.Error(w, `{"error":"message and signature are required"}`, http.StatusBadRequest)
		return
	}

	// 1. Parse SIWE message
	siweMsg, err := siwe.ParseMessage(req.Message)
	if err != nil {
		http.Error(w, `{"error":"invalid SIWE message format: `+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	// 2. Verify Nonce existence and expiration
	msgNonce := siweMsg.GetNonce()
	h.nonceMutex.Lock()
	entry, exists := h.nonces[msgNonce]
	if exists {
		delete(h.nonces, msgNonce) // single-use protection
	}
	h.nonceMutex.Unlock()

	if !exists || time.Now().After(entry.expiresAt) {
		http.Error(w, `{"error":"nonce is invalid or has expired"}`, http.StatusUnauthorized)
		return
	}

	// 3. Cryptographically verify signature
	now := time.Now()
	_, err = siweMsg.Verify(req.Signature, nil, &msgNonce, &now)
	if err != nil {
		http.Error(w, `{"error":"cryptographic signature verification failed: `+err.Error()+`"}`, http.StatusUnauthorized)
		return
	}

	// Normalized address in lowercase
	walletAddress := strings.ToLower(siweMsg.GetAddress().Hex())

	// 4. Find or create user in PostgreSQL
	var user models.User
	err = database.DB.QueryRow(r.Context(),
		`SELECT id, wallet_address, email, name, role, avatar_url, created_at, updated_at
		 FROM users WHERE LOWER(wallet_address) = $1`, walletAddress).Scan(
		&user.ID, &user.WalletAddress, &user.Email, &user.Name,
		&user.Role, &user.AvatarURL, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		// Create new user with default 'customer' role
		userID := uuid.New().String()
		user = models.User{
			ID:            userID,
			WalletAddress: walletAddress,
			Role:          "customer",
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		_, err = database.DB.Exec(r.Context(),
			`INSERT INTO users (id, wallet_address, role, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5)`,
			user.ID, user.WalletAddress, user.Role, user.CreatedAt, user.UpdatedAt)
		if err != nil {
			http.Error(w, `{"error":"failed to create user in database"}`, http.StatusInternalServerError)
			return
		}
	}

	// 5. Generate JWT
	token, err := middleware.GenerateToken(h.JWTSecret, user.WalletAddress, user.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to generate JWT token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.AuthResponse{
		Token: token,
		User:  &user,
	})
}

func (h *AuthHandler) HandleMe(w http.ResponseWriter, r *http.Request) {
	userID := h.extractUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var user models.User
	err := database.DB.QueryRow(r.Context(),
		`SELECT id, wallet_address, email, name, role, avatar_url, created_at, updated_at
		 FROM users WHERE id = $1`, userID).Scan(
		&user.ID, &user.WalletAddress, &user.Email, &user.Name,
		&user.Role, &user.AvatarURL, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) HandleUpdateRole(w http.ResponseWriter, r *http.Request) {
	userID := h.extractUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	req.Role = strings.ToLower(strings.TrimSpace(req.Role))
	if req.Role != "customer" && req.Role != "provider" {
		http.Error(w, `{"error":"role must be 'customer' or 'provider'"}`, http.StatusBadRequest)
		return
	}

	// Update user role
	_, err := database.DB.Exec(r.Context(),
		`UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`, req.Role, userID)
	if err != nil {
		http.Error(w, `{"error":"failed to update user role"}`, http.StatusInternalServerError)
		return
	}

	// If role is provider, ensure a provider profile exists
	if req.Role == "provider" {
		var exists bool
		database.DB.QueryRow(r.Context(),
			`SELECT EXISTS(SELECT 1 FROM providers WHERE user_id = $1)`, userID).Scan(&exists)
		if !exists {
			providerID := uuid.New().String()
			database.DB.Exec(r.Context(),
				`INSERT INTO providers (id, user_id, business_name, category, description, rating, verified, created_at)
				 VALUES ($1, $2, $3, $4, $5, 5.0, true, NOW())`,
				providerID, userID, "Mi Negocio / Consultorio", "general", "Servicios profesionales y garantías verificadas.")
		}
	}

	var user models.User
	err = database.DB.QueryRow(r.Context(),
		`SELECT id, wallet_address, email, name, role, avatar_url, created_at, updated_at
		 FROM users WHERE id = $1`, userID).Scan(
		&user.ID, &user.WalletAddress, &user.Email, &user.Name,
		&user.Role, &user.AvatarURL, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
