package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgtype"
	"github.com/securemarket/backend/internal/database"
	"github.com/securemarket/backend/internal/middleware"
	"github.com/securemarket/backend/internal/models"
)

type ContractHandler struct{}

func NewContractHandler() *ContractHandler {
	return &ContractHandler{}
}

func (h *ContractHandler) Routes(r chi.Router) {
	r.Get("/", h.List)
	r.Get("/{id}", h.Get)
	r.Post("/", h.Create)
	r.Post("/{id}/terminate", h.Terminate)
}

func (h *ContractHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	role := r.URL.Query().Get("role")

	var query string
	var args []interface{}

	if role == "provider" {
		query = `SELECT c.id, c.service_id, c.customer_id, c.provider_id, c.key_id, c.lock_address, c.status, c.terms, c.signed_at, c.expires_at, c.blockchain_tx_hash, c.created_at
			FROM contracts c
			JOIN providers p ON c.provider_id = p.id
			WHERE p.user_id = $1
			ORDER BY c.created_at DESC`
		args = []interface{}{userID}
	} else {
		query = `SELECT id, service_id, customer_id, provider_id, key_id, lock_address, status, terms, signed_at, expires_at, blockchain_tx_hash, created_at
			FROM contracts WHERE customer_id = $1
			ORDER BY created_at DESC`
		args = []interface{}{userID}
	}

	rows, err := database.DB.Query(r.Context(), query, args...)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch contracts"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var contracts []models.Contract
	for rows.Next() {
		var c models.Contract
		rows.Scan(&c.ID, &c.ServiceID, &c.CustomerID, &c.ProviderID,
			&c.KeyID, &c.LockAddress, &c.Status, &c.Terms,
			&c.SignedAt, &c.ExpiresAt, &c.BlockchainTx, &c.CreatedAt)
		contracts = append(contracts, c)
	}

	json.NewEncoder(w).Encode(contracts)
}

func (h *ContractHandler) Get(w http.ResponseWriter, r *http.Request) {
	contractID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r)

	var c models.Contract
	err := database.DB.QueryRow(r.Context(),
		`SELECT id, service_id, customer_id, provider_id, key_id, lock_address, status, terms, signed_at, expires_at, blockchain_tx_hash, created_at
		 FROM contracts WHERE id = $1`, contractID).Scan(
		&c.ID, &c.ServiceID, &c.CustomerID, &c.ProviderID,
		&c.KeyID, &c.LockAddress, &c.Status, &c.Terms,
		&c.SignedAt, &c.ExpiresAt, &c.BlockchainTx, &c.CreatedAt)
	if err != nil {
		http.Error(w, `{"error":"contract not found"}`, http.StatusNotFound)
		return
	}

	// Verify access
	if c.CustomerID != userID && c.ProviderID != userID {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusForbidden)
		return
	}

	json.NewEncoder(w).Encode(c)
}

func (h *ContractHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req struct {
		ServiceID string `json:"service_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Get service and provider info
	var service models.Service
	var providerID string
	err := database.DB.QueryRow(r.Context(),
		`SELECT s.id, s.provider_id, s.lock_address, s.network_id, s.title, s.description, s.category, s.price_usd, s.coverage_amount, s.coverage_details, s.duration_days, s.max_members, s.active_members, s.status, p.user_id
		 FROM services s JOIN providers p ON s.provider_id = p.id WHERE s.id = $1`, req.ServiceID).Scan(
		&service.ID, &service.ProviderID, &service.LockAddress, &service.NetworkID,
		&service.Title, &service.Description, &service.Category, &service.PriceUSD,
		&service.CoverageAmount, &service.CoverageDetails, &service.DurationDays,
		&service.MaxMembers, &service.ActiveMembers, &service.Status, &providerID)
	if err != nil {
		http.Error(w, `{"error":"service not found"}`, http.StatusNotFound)
		return
	}

	if providerID == userID {
		http.Error(w, `{"error":"cannot subscribe to your own service"}`, http.StatusBadRequest)
		return
	}

	// Create contract terms
	terms := map[string]interface{}{
		"service_title":    service.Title,
		"coverage_amount":  service.CoverageAmount,
		"price_usd":        service.PriceUSD,
		"category":         service.Category,
		"coverage_details": service.CoverageDetails,
	}
	termsJSON, _ := json.Marshal(terms)
	jsonb := pgtype.JSONB{}
	jsonb.Set(termsJSON)

	id := uuid.New().String()
	now := time.Now()
	expiresAt := now.AddDate(0, 1, 0) // 1 month from now

	_, err = database.DB.Exec(r.Context(),
		`INSERT INTO contracts (id, service_id, customer_id, provider_id, lock_address, status, terms, signed_at, expires_at)
		 VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8)`,
		id, req.ServiceID, userID, service.ProviderID, service.LockAddress, jsonb, now, expiresAt)
	if err != nil {
		http.Error(w, `{"error":"failed to create contract"}`, http.StatusInternalServerError)
		return
	}

	// Update active members count
	database.DB.Exec(r.Context(),
		`UPDATE services SET active_members = active_members + 1 WHERE id = $1`, req.ServiceID)

	var c models.Contract
	database.DB.QueryRow(r.Context(),
		`SELECT id, service_id, customer_id, provider_id, key_id, lock_address, status, terms, signed_at, expires_at, blockchain_tx_hash, created_at
		 FROM contracts WHERE id = $1`, id).Scan(
		&c.ID, &c.ServiceID, &c.CustomerID, &c.ProviderID,
		&c.KeyID, &c.LockAddress, &c.Status, &c.Terms,
		&c.SignedAt, &c.ExpiresAt, &c.BlockchainTx, &c.CreatedAt)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

func (h *ContractHandler) Terminate(w http.ResponseWriter, r *http.Request) {
	contractID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r)

	var c models.Contract
	err := database.DB.QueryRow(r.Context(),
		`SELECT id, customer_id, provider_id, service_id, status FROM contracts WHERE id = $1`, contractID).Scan(
		&c.ID, &c.CustomerID, &c.ProviderID, &c.ServiceID, &c.Status)
	if err != nil {
		http.Error(w, `{"error":"contract not found"}`, http.StatusNotFound)
		return
	}

	if c.CustomerID != userID && c.ProviderID != userID {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusForbidden)
		return
	}

	if c.Status != "active" {
		http.Error(w, `{"error":"contract is not active"}`, http.StatusBadRequest)
		return
	}

	database.DB.Exec(r.Context(),
		`UPDATE contracts SET status = 'terminated' WHERE id = $1`, contractID)

	database.DB.Exec(r.Context(),
		`UPDATE services SET active_members = active_members - 1 WHERE id = $1`, c.ServiceID)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "terminated"})
}
