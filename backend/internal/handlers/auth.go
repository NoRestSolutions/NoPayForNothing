package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/securemarket/backend/internal/database"
	"github.com/securemarket/backend/internal/middleware"
	"github.com/securemarket/backend/internal/models"
)

type AuthHandler struct {
	JWTSecret    string
	FrontendURL  string
}

func NewAuthHandler(jwtSecret, frontendURL string) *AuthHandler {
	return &AuthHandler{
		JWTSecret:   jwtSecret,
		FrontendURL: frontendURL,
	}
}

func (h *AuthHandler) Routes(r chi.Router) {
	r.Post("/siwe", h.HandleSIWE)
	r.Get("/me", h.HandleMe)
}

func (h *AuthHandler) HandleSIWE(w http.ResponseWriter, r *http.Request) {
	var req models.AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	// TODO: Verify SIWE message signature
	// For now, we'll extract the address from the message
	// In production, use go-eth-siwe or similar library

	// Extract wallet address from message (simplified)
	// Real implementation would verify the signature
	walletAddress := "0x..." // Extract from verified signature

	// Find or create user
	var user models.User
	err := database.DB.QueryRow(r.Context(),
		`SELECT id, wallet_address, email, name, role, avatar_url, created_at, updated_at
		 FROM users WHERE wallet_address = $1`, walletAddress).Scan(
		&user.ID, &user.WalletAddress, &user.Email, &user.Name,
		&user.Role, &user.AvatarURL, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		// Create new user
		userID := uuid.New().String()
		user = models.User{
			ID:            userID,
			WalletAddress: walletAddress,
			Role:          "customer",
		}

		_, err = database.DB.Exec(r.Context(),
			`INSERT INTO users (id, wallet_address, role)
			 VALUES ($1, $2, $3)`,
			user.ID, user.WalletAddress, user.Role)
		if err != nil {
			http.Error(w, `{"error":"failed to create user"}`, http.StatusInternalServerError)
			return
		}
	}

	// Generate JWT
	token, err := middleware.GenerateToken(h.JWTSecret, user.WalletAddress, user.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(models.AuthResponse{
		Token: token,
		User:  &user,
	})
}

func (h *AuthHandler) HandleMe(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
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

	json.NewEncoder(w).Encode(user)
}
