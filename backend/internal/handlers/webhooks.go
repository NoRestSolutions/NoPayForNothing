package handlers

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/securemarket/backend/internal/database"
)

type WebhookHandler struct {
	WebhookSecret string
}

func NewWebhookHandler() *WebhookHandler {
	return &WebhookHandler{
		WebhookSecret: os.Getenv("UNLOCK_WEBHOOK_SECRET"),
	}
}

func (h *WebhookHandler) Routes(r chi.Router) {
	r.Post("/unlock", h.HandleUnlockWebhook)
	r.Post("/locksmith", h.HandleLocksmithWebhook)
}

type UnlockWebhookEvent struct {
	Event   string      `json:"event"`
	Network int         `json:"network"`
	Data    interface{} `json:"data"`
}

func (h *WebhookHandler) HandleUnlockWebhook(w http.ResponseWriter, r *http.Request) {
	if h.WebhookSecret != "" {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, `{"error":"failed to read body"}`, http.StatusBadRequest)
			return
		}

		sigHeader := r.Header.Get("X-Unlock-Signature")
		if !h.verifySignature(body, sigHeader) {
			http.Error(w, `{"error":"invalid signature"}`, http.StatusUnauthorized)
			return
		}

		r.Body = io.NopCloser(bytes.NewBuffer(body))
	}

	var event UnlockWebhookEvent
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	switch event.Event {
	case "key purchased":
		h.handleKeyPurchased(event)
	case "key renewed":
		h.handleKeyRenewed(event)
	case "key cancelled":
		h.handleKeyCancelled(event)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (h *WebhookHandler) handleKeyPurchased(event UnlockWebhookEvent) {
	data, ok := event.Data.(map[string]interface{})
	if !ok {
		return
	}

	lockAddress, _ := data["lock"].(string)
	ownerAddress, _ := data["owner"].(string)
	keyID, _ := data["keyId"].(string)
	txHash, _ := data["transaction"].(string)

	var contractID string
	err := database.DB.QueryRow(context.Background(),
		`SELECT c.id FROM contracts c
		 JOIN users u ON c.customer_id = u.id
		 WHERE c.lock_address = $1 AND u.wallet_address = $2 AND c.status = 'pending'`,
		lockAddress, ownerAddress).Scan(&contractID)
	if err != nil {
		return
	}

	database.DB.Exec(context.Background(),
		`UPDATE contracts SET status = 'active', key_id = $1, blockchain_tx_hash = $2 WHERE id = $3`,
		keyID, txHash, contractID)

	subID := uuid.New().String()
	database.DB.Exec(context.Background(),
		`INSERT INTO subscriptions (id, contract_id, user_id, tx_hash, status)
		 SELECT $1, c.id, c.customer_id, $2, 'active'
		 FROM contracts c WHERE c.id = $3`,
		subID, txHash, contractID)
}

func (h *WebhookHandler) handleKeyRenewed(event UnlockWebhookEvent) {
	data, ok := event.Data.(map[string]interface{})
	if !ok {
		return
	}

	lockAddress, _ := data["lock"].(string)
	keyID, _ := data["keyId"].(string)

	database.DB.Exec(context.Background(),
		`UPDATE contracts SET expires_at = $1 WHERE lock_address = $2 AND key_id = $3`,
		time.Now().AddDate(0, 1, 0), lockAddress, keyID)
}

func (h *WebhookHandler) handleKeyCancelled(event UnlockWebhookEvent) {
	data, ok := event.Data.(map[string]interface{})
	if !ok {
		return
	}

	lockAddress, _ := data["lock"].(string)
	keyID, _ := data["keyId"].(string)

	database.DB.Exec(context.Background(),
		`UPDATE contracts SET status = 'terminated' WHERE lock_address = $1 AND key_id = $2`,
		lockAddress, keyID)
}

func (h *WebhookHandler) HandleLocksmithWebhook(w http.ResponseWriter, r *http.Request) {
	var event map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (h *WebhookHandler) verifySignature(payload []byte, signature string) bool {
	mac := hmac.New(sha256.New, []byte(h.WebhookSecret))
	mac.Write(payload)
	expectedMAC := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expectedMAC))
}
