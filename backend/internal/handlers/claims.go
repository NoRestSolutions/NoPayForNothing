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

type ClaimHandler struct{}

func NewClaimHandler() *ClaimHandler {
	return &ClaimHandler{}
}

func (h *ClaimHandler) Routes(r chi.Router) {
	r.Get("/", h.List)
	r.Post("/{contractId}", h.Create)
	r.Put("/{id}/approve", h.Approve)
	r.Put("/{id}/reject", h.Reject)
}

func (h *ClaimHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	role := r.URL.Query().Get("role")

	var query string
	var args []interface{}

	if role == "provider" {
		query = `SELECT cl.id, cl.contract_id, cl.amount, cl.description, cl.status, cl.evidence_urls, cl.resolved_at, cl.payout_tx_hash, cl.created_at
			FROM claims cl
			JOIN contracts c ON cl.contract_id = c.id
			JOIN providers p ON c.provider_id = p.id
			WHERE p.user_id = $1
			ORDER BY cl.created_at DESC`
		args = []interface{}{userID}
	} else {
		query = `SELECT cl.id, cl.contract_id, cl.amount, cl.description, cl.status, cl.evidence_urls, cl.resolved_at, cl.payout_tx_hash, cl.created_at
			FROM claims cl
			JOIN contracts c ON cl.contract_id = c.id
			WHERE c.customer_id = $1
			ORDER BY cl.created_at DESC`
		args = []interface{}{userID}
	}

	rows, err := database.DB.Query(r.Context(), query, args...)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch claims"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var claims []models.Claim
	for rows.Next() {
		var cl models.Claim
		rows.Scan(&cl.ID, &cl.ContractID, &cl.Amount, &cl.Description,
			&cl.Status, &cl.EvidenceUrls, &cl.ResolvedAt, &cl.PayoutTxHash, &cl.CreatedAt)
		claims = append(claims, cl)
	}

	json.NewEncoder(w).Encode(claims)
}

func (h *ClaimHandler) Create(w http.ResponseWriter, r *http.Request) {
	contractID := chi.URLParam(r, "contractId")
	userID := middleware.GetUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req models.ClaimCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Verify contract ownership
	var customerID string
	var coverageAmount float64
	err := database.DB.QueryRow(r.Context(),
		`SELECT c.customer_id, s.coverage_amount
		 FROM contracts c JOIN services s ON c.service_id = s.id
		 WHERE c.id = $1`, contractID).Scan(&customerID, &coverageAmount)
	if err != nil {
		http.Error(w, `{"error":"contract not found"}`, http.StatusNotFound)
		return
	}

	if customerID != userID {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusForbidden)
		return
	}

	if req.Amount > coverageAmount {
		http.Error(w, `{"error":"claim amount exceeds coverage"}`, http.StatusBadRequest)
		return
	}

	id := uuid.New().String()
	evidenceArray := pgtype.TextArray{}
	evidenceArray.Set(req.EvidenceUrls)

	_, err = database.DB.Exec(r.Context(),
		`INSERT INTO claims (id, contract_id, amount, description, evidence_urls)
		 VALUES ($1, $2, $3, $4, $5)`,
		id, contractID, req.Amount, req.Description, evidenceArray)
	if err != nil {
		http.Error(w, `{"error":"failed to create claim"}`, http.StatusInternalServerError)
		return
	}

	// Update contract status
	database.DB.Exec(r.Context(),
		`UPDATE contracts SET status = 'claimed' WHERE id = $1`, contractID)

	var cl models.Claim
	database.DB.QueryRow(r.Context(),
		`SELECT id, contract_id, amount, description, status, evidence_urls, resolved_at, payout_tx_hash, created_at
		 FROM claims WHERE id = $1`, id).Scan(
		&cl.ID, &cl.ContractID, &cl.Amount, &cl.Description,
		&cl.Status, &cl.EvidenceUrls, &cl.ResolvedAt, &cl.PayoutTxHash, &cl.CreatedAt)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cl)
}

func (h *ClaimHandler) Approve(w http.ResponseWriter, r *http.Request) {
	claimID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r)

	// Verify provider ownership
	var providerUserID string
	err := database.DB.QueryRow(r.Context(),
		`SELECT p.user_id FROM claims cl
		 JOIN contracts c ON cl.contract_id = c.id
		 JOIN providers p ON c.provider_id = p.id
		 WHERE cl.id = $1`, claimID).Scan(&providerUserID)
	if err != nil {
		http.Error(w, `{"error":"claim not found"}`, http.StatusNotFound)
		return
	}

	if providerUserID != userID {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusForbidden)
		return
	}

	now := time.Now()
	database.DB.Exec(r.Context(),
		`UPDATE claims SET status = 'approved', resolved_at = $1 WHERE id = $2`, now, claimID)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "approved"})
}

func (h *ClaimHandler) Reject(w http.ResponseWriter, r *http.Request) {
	claimID := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r)

	var providerUserID string
	err := database.DB.QueryRow(r.Context(),
		`SELECT p.user_id FROM claims cl
		 JOIN contracts c ON cl.contract_id = c.id
		 JOIN providers p ON c.provider_id = p.id
		 WHERE cl.id = $1`, claimID).Scan(&providerUserID)
	if err != nil {
		http.Error(w, `{"error":"claim not found"}`, http.StatusNotFound)
		return
	}

	if providerUserID != userID {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusForbidden)
		return
	}

	now := time.Now()
	database.DB.Exec(r.Context(),
		`UPDATE claims SET status = 'rejected', resolved_at = $1 WHERE id = $2`, now, claimID)

	// Get contract ID to restore status
	var contractID string
	database.DB.QueryRow(r.Context(),
		`SELECT contract_id FROM claims WHERE id = $1`, claimID).Scan(&contractID)
	database.DB.Exec(r.Context(),
		`UPDATE contracts SET status = 'active' WHERE id = $1`, contractID)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "rejected"})
}
