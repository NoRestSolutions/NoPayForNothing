package handlers

import (
	"encoding/json"
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/securemarket/backend/internal/database"
	"github.com/securemarket/backend/internal/middleware"
	"github.com/securemarket/backend/internal/models"
)

type ProviderHandler struct {
	JWTSecret string
}

func NewProviderHandler(jwtSecret string) *ProviderHandler {
	return &ProviderHandler{
		JWTSecret: jwtSecret,
	}
}

func (h *ProviderHandler) Routes(r chi.Router) {
	r.Get("/", h.List)
	r.Get("/{id}", h.Get)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
}

func (h *ProviderHandler) extractUserID(r *http.Request) string {
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

func (h *ProviderHandler) List(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	offset := (page - 1) * perPage

	var total int
	database.DB.QueryRow(r.Context(),
		`SELECT COUNT(*) FROM providers`).Scan(&total)

	rows, err := database.DB.Query(r.Context(),
		`SELECT id, user_id, business_name, category, description, rating, total_contracts, verified, created_at
		 FROM providers ORDER BY created_at DESC LIMIT $1 OFFSET $2`, perPage, offset)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch providers"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var providers []models.Provider
	for rows.Next() {
		var p models.Provider
		rows.Scan(&p.ID, &p.UserID, &p.BusinessName, &p.Category, &p.Description,
			&p.Rating, &p.TotalContracts, &p.Verified, &p.CreatedAt)
		providers = append(providers, p)
	}

	json.NewEncoder(w).Encode(models.PaginatedResponse{
		Data:       providers,
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: int(math.Ceil(float64(total) / float64(perPage))),
	})
}

func (h *ProviderHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var p models.Provider
	err := database.DB.QueryRow(r.Context(),
		`SELECT id, user_id, business_name, category, description, rating, total_contracts, verified, created_at
		 FROM providers WHERE id = $1`, id).Scan(
		&p.ID, &p.UserID, &p.BusinessName, &p.Category, &p.Description,
		&p.Rating, &p.TotalContracts, &p.Verified, &p.CreatedAt)
	if err != nil {
		http.Error(w, `{"error":"provider not found"}`, http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(p)
}

func (h *ProviderHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := h.extractUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req struct {
		BusinessName string `json:"business_name"`
		Category     string `json:"category"`
		Description  string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Check if user already has a provider profile
	var exists bool
	database.DB.QueryRow(r.Context(),
		`SELECT EXISTS(SELECT 1 FROM providers WHERE user_id = $1)`, userID).Scan(&exists)
	if exists {
		http.Error(w, `{"error":"provider profile already exists"}`, http.StatusConflict)
		return
	}

	id := uuid.New().String()
	_, err := database.DB.Exec(r.Context(),
		`INSERT INTO providers (id, user_id, business_name, category, description, rating, verified, created_at)
		 VALUES ($1, $2, $3, $4, $5, 5.0, true, NOW())`,
		id, userID, req.BusinessName, req.Category, req.Description)
	if err != nil {
		http.Error(w, `{"error":"failed to create provider: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	// Update user role
	database.DB.Exec(r.Context(),
		`UPDATE users SET role = 'provider' WHERE id = $1`, userID)

	var p models.Provider
	database.DB.QueryRow(r.Context(),
		`SELECT id, user_id, business_name, category, description, rating, total_contracts, verified, created_at
		 FROM providers WHERE id = $1`, id).Scan(
		&p.ID, &p.UserID, &p.BusinessName, &p.Category, &p.Description,
		&p.Rating, &p.TotalContracts, &p.Verified, &p.CreatedAt)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

func (h *ProviderHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := h.extractUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	providerID := chi.URLParam(r, "id")

	// Verify ownership
	var ownerID string
	database.DB.QueryRow(r.Context(),
		`SELECT user_id FROM providers WHERE id = $1`, providerID).Scan(&ownerID)
	if ownerID != userID {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusForbidden)
		return
	}

	var req struct {
		BusinessName string `json:"business_name"`
		Category     string `json:"category"`
		Description  string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	_, err := database.DB.Exec(r.Context(),
		`UPDATE providers SET business_name = $1, category = $2, description = $3 WHERE id = $4`,
		req.BusinessName, req.Category, req.Description, providerID)
	if err != nil {
		http.Error(w, `{"error":"failed to update provider"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}
