package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/securemarket/backend/internal/database"
	"github.com/securemarket/backend/internal/middleware"
	"github.com/securemarket/backend/internal/models"
	"github.com/securemarket/backend/pkg/unlock"
)

type LockHandler struct {
	Subgraph  *unlock.SubgraphService
	JWTSecret string
}

func NewLockHandler(subgraphEndpoint string, jwtSecret string) *LockHandler {
	return &LockHandler{
		Subgraph:  unlock.NewSubgraphService(subgraphEndpoint),
		JWTSecret: jwtSecret,
	}
}

func (h *LockHandler) Routes(r chi.Router) {
	r.Get("/{lockAddress}", h.GetLock)
	r.Get("/{lockAddress}/keys", h.GetKeys)
	r.Put("/{serviceId}/link", h.LinkToService)
}

func (h *LockHandler) extractUserID(r *http.Request) string {
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

func (h *LockHandler) GetLock(w http.ResponseWriter, r *http.Request) {
	lockAddress := chi.URLParam(r, "lockAddress")

	lock, err := h.Subgraph.QueryLockByAddress(lockAddress)
	if err != nil {
		http.Error(w, `{"error":"lock not found on-chain"}`, http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(lock)
}

func (h *LockHandler) GetKeys(w http.ResponseWriter, r *http.Request) {
	lockAddress := chi.URLParam(r, "lockAddress")

	keys, err := h.Subgraph.QueryKeysByLock(lockAddress, 100, 0)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch keys"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(keys)
}

func (h *LockHandler) LinkToService(w http.ResponseWriter, r *http.Request) {
	serviceID := chi.URLParam(r, "serviceId")

	userID := h.extractUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var ownerID string
	err := database.DB.QueryRow(r.Context(),
		`SELECT p.user_id FROM services s JOIN providers p ON s.provider_id = p.id WHERE s.id = $1`, serviceID).Scan(&ownerID)
	if err != nil || ownerID != userID {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusForbidden)
		return
	}

	var req models.LinkLockRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.LockAddress == "" {
		http.Error(w, `{"error":"lock_address is required"}`, http.StatusBadRequest)
		return
	}
	if req.NetworkID == 0 {
		req.NetworkID = 11155111
	}

	_, err = database.DB.Exec(r.Context(),
		`UPDATE services SET lock_address = $1, network_id = $2, updated_at = NOW() WHERE id = $3`,
		req.LockAddress, req.NetworkID, serviceID)
	if err != nil {
		http.Error(w, `{"error":"failed to link lock"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "linked", "lock_address": req.LockAddress})
}
