package handlers

import (
	"encoding/json"
	"math"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgtype"
	"github.com/securemarket/backend/internal/database"
	"github.com/securemarket/backend/internal/middleware"
	"github.com/securemarket/backend/internal/models"
)

type ServiceHandler struct{}

func NewServiceHandler() *ServiceHandler {
	return &ServiceHandler{}
}

func (h *ServiceHandler) Routes(r chi.Router) {
	r.Get("/", h.List)
	r.Get("/{id}", h.Get)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Archive)
}

func (h *ServiceHandler) List(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	offset := (page - 1) * perPage
	category := r.URL.Query().Get("category")

	query := `SELECT COUNT(*) FROM services WHERE status = 'active'`
	args := []interface{}{}
	argIdx := 1

	if category != "" {
		query += ` AND category = $` + strconv.Itoa(argIdx)
		args = append(args, category)
		argIdx++
	}

	var total int
	database.DB.QueryRow(r.Context(), query, args...).Scan(&total)

	dataQuery := `SELECT id, provider_id, lock_address, network_id, title, description, category, price_usd, coverage_amount, coverage_details, duration_days, max_members, active_members, status, created_at, updated_at
		FROM services WHERE status = 'active'`
	dataArgs := make([]interface{}, len(args))
	copy(dataArgs, args)

	if category != "" {
		dataQuery += ` AND category = $1`
		dataArgs = []interface{}{category}
	}

	dataQuery += ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	dataArgs = append(dataArgs, perPage, offset)

	rows, err := database.DB.Query(r.Context(), dataQuery, dataArgs...)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch services"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		rows.Scan(&s.ID, &s.ProviderID, &s.LockAddress, &s.NetworkID, &s.Title,
			&s.Description, &s.Category, &s.PriceUSD, &s.CoverageAmount,
			&s.CoverageDetails, &s.DurationDays, &s.MaxMembers, &s.ActiveMembers,
			&s.Status, &s.CreatedAt, &s.UpdatedAt)
		services = append(services, s)
	}

	json.NewEncoder(w).Encode(models.PaginatedResponse{
		Data:       services,
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: int(math.Ceil(float64(total) / float64(perPage))),
	})
}

func (h *ServiceHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var s models.Service
	err := database.DB.QueryRow(r.Context(),
		`SELECT id, provider_id, lock_address, network_id, title, description, category, price_usd, coverage_amount, coverage_details, duration_days, max_members, active_members, status, created_at, updated_at
		 FROM services WHERE id = $1`, id).Scan(
		&s.ID, &s.ProviderID, &s.LockAddress, &s.NetworkID, &s.Title,
		&s.Description, &s.Category, &s.PriceUSD, &s.CoverageAmount,
		&s.CoverageDetails, &s.DurationDays, &s.MaxMembers, &s.ActiveMembers,
		&s.Status, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		http.Error(w, `{"error":"service not found"}`, http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(s)
}

func (h *ServiceHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req models.ServiceCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Get provider ID
	var providerID string
	err := database.DB.QueryRow(r.Context(),
		`SELECT id FROM providers WHERE user_id = $1`, userID).Scan(&providerID)
	if err != nil {
		http.Error(w, `{"error":"provider profile not found"}`, http.StatusNotFound)
		return
	}

	id := uuid.New().String()
	coverageDetails, _ := json.Marshal(req.CoverageDetails)
	jsonb := pgtype.JSONB{}
	jsonb.Set(coverageDetails)

	_, err = database.DB.Exec(r.Context(),
		`INSERT INTO services (id, provider_id, title, description, category, price_usd, coverage_amount, coverage_details, duration_days, max_members)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		id, providerID, req.Title, req.Description, req.Category,
		req.PriceUSD, req.CoverageAmount, jsonb, req.DurationDays, req.MaxMembers)
	if err != nil {
		http.Error(w, `{"error":"failed to create service"}`, http.StatusInternalServerError)
		return
	}

	var s models.Service
	database.DB.QueryRow(r.Context(),
		`SELECT id, provider_id, lock_address, network_id, title, description, category, price_usd, coverage_amount, coverage_details, duration_days, max_members, active_members, status, created_at, updated_at
		 FROM services WHERE id = $1`, id).Scan(
		&s.ID, &s.ProviderID, &s.LockAddress, &s.NetworkID, &s.Title,
		&s.Description, &s.Category, &s.PriceUSD, &s.CoverageAmount,
		&s.CoverageDetails, &s.DurationDays, &s.MaxMembers, &s.ActiveMembers,
		&s.Status, &s.CreatedAt, &s.UpdatedAt)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(s)
}

func (h *ServiceHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	serviceID := chi.URLParam(r, "id")

	// Verify ownership
	var ownerID string
	err := database.DB.QueryRow(r.Context(),
		`SELECT p.user_id FROM services s JOIN providers p ON s.provider_id = p.id WHERE s.id = $1`, serviceID).Scan(&ownerID)
	if err != nil || ownerID != userID {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusForbidden)
		return
	}

	var req models.ServiceCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	coverageDetails, _ := json.Marshal(req.CoverageDetails)
	jsonb := pgtype.JSONB{}
	jsonb.Set(coverageDetails)

	_, err = database.DB.Exec(r.Context(),
		`UPDATE services SET title = $1, description = $2, category = $3, price_usd = $4, coverage_amount = $5, coverage_details = $6, duration_days = $7, max_members = $8, updated_at = NOW() WHERE id = $9`,
		req.Title, req.Description, req.Category, req.PriceUSD,
		req.CoverageAmount, jsonb, req.DurationDays, req.MaxMembers, serviceID)
	if err != nil {
		http.Error(w, `{"error":"failed to update service"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

func (h *ServiceHandler) Archive(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	serviceID := chi.URLParam(r, "id")

	var ownerID string
	err := database.DB.QueryRow(r.Context(),
		`SELECT p.user_id FROM services s JOIN providers p ON s.provider_id = p.id WHERE s.id = $1`, serviceID).Scan(&ownerID)
	if err != nil || ownerID != userID {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusForbidden)
		return
	}

	database.DB.Exec(r.Context(),
		`UPDATE services SET status = 'archived', updated_at = NOW() WHERE id = $1`, serviceID)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "archived"})
}
