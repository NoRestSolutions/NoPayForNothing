package models

import (
	"time"

	"github.com/jackc/pgtype"
)

type User struct {
	ID            string    `json:"id" db:"id"`
	WalletAddress string    `json:"wallet_address" db:"wallet_address"`
	Email         *string   `json:"email,omitempty" db:"email"`
	Name          *string   `json:"name,omitempty" db:"name"`
	Role          string    `json:"role" db:"role"`
	AvatarURL     *string   `json:"avatar_url,omitempty" db:"avatar_url"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

type Provider struct {
	ID             string    `json:"id" db:"id"`
	UserID         string    `json:"user_id" db:"user_id"`
	BusinessName   string    `json:"business_name" db:"business_name"`
	Category       string    `json:"category" db:"category"`
	Description    *string   `json:"description,omitempty" db:"description"`
	Rating         float64   `json:"rating" db:"rating"`
	TotalContracts int       `json:"total_contracts" db:"total_contracts"`
	Verified       bool      `json:"verified" db:"verified"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

type Service struct {
	ID              string         `json:"id" db:"id"`
	ProviderID      string         `json:"provider_id" db:"provider_id"`
	ProviderName    string         `json:"provider_name,omitempty" db:"provider_name"`
	LockAddress     *string        `json:"lock_address,omitempty" db:"lock_address"`
	NetworkID       int            `json:"network_id" db:"network_id"`
	Title           string         `json:"title" db:"title"`
	Description     string         `json:"description" db:"description"`
	Category        string         `json:"category" db:"category"`
	PriceUSD        float64        `json:"price_usd" db:"price_usd"`
	CoverageAmount  float64        `json:"coverage_amount" db:"coverage_amount"`
	CoverageDetails pgtype.JSONB   `json:"coverage_details" db:"coverage_details"`
	DurationDays    *int           `json:"duration_days,omitempty" db:"duration_days"`
	MaxMembers      *int           `json:"max_members,omitempty" db:"max_members"`
	ActiveMembers   int            `json:"active_members" db:"active_members"`
	Status          string         `json:"status" db:"status"`
	CreatedAt       time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at" db:"updated_at"`
}

type Contract struct {
	ID              string         `json:"id" db:"id"`
	ServiceID       string         `json:"service_id" db:"service_id"`
	CustomerID      string         `json:"customer_id" db:"customer_id"`
	ProviderID      string         `json:"provider_id" db:"provider_id"`
	ServiceTitle    string         `json:"service_title,omitempty" db:"service_title"`
	ProviderName    string         `json:"provider_name,omitempty" db:"provider_name"`
	CustomerAddress string         `json:"customer_address,omitempty" db:"customer_address"`
	PriceUSD        float64        `json:"price_usd,omitempty" db:"price_usd"`
	CoverageAmount  float64        `json:"coverage_amount,omitempty" db:"coverage_amount"`
	KeyID           *string        `json:"key_id,omitempty" db:"key_id"`
	LockAddress     *string        `json:"lock_address,omitempty" db:"lock_address"`
	Status          string         `json:"status" db:"status"`
	Terms           pgtype.JSONB   `json:"terms" db:"terms"`
	SignedAt        *time.Time     `json:"signed_at,omitempty" db:"signed_at"`
	ExpiresAt       *time.Time     `json:"expires_at,omitempty" db:"expires_at"`
	BlockchainTx    *string        `json:"blockchain_tx_hash,omitempty" db:"blockchain_tx_hash"`
	CreatedAt       time.Time      `json:"created_at" db:"created_at"`
}

type Claim struct {
	ID              string           `json:"id" db:"id"`
	ContractID      string           `json:"contract_id" db:"contract_id"`
	ServiceTitle    string           `json:"service_title,omitempty" db:"service_title"`
	ProviderName    string           `json:"provider_name,omitempty" db:"provider_name"`
	CustomerAddress string           `json:"customer_address,omitempty" db:"customer_address"`
	Amount          float64          `json:"amount" db:"amount"`
	Description     string           `json:"description" db:"description"`
	Status          string           `json:"status" db:"status"`
	EvidenceUrls    pgtype.TextArray `json:"evidence_urls" db:"evidence_urls"`
	ResolvedAt      *time.Time       `json:"resolved_at,omitempty" db:"resolved_at"`
	PayoutTxHash    *string          `json:"payout_tx_hash,omitempty" db:"payout_tx_hash"`
	CreatedAt       time.Time        `json:"created_at" db:"created_at"`
}

type Subscription struct {
	ID              string    `json:"id" db:"id"`
	ContractID      string    `json:"contract_id" db:"contract_id"`
	UserID          string    `json:"user_id" db:"user_id"`
	AmountUSD       float64   `json:"amount_usd" db:"amount_usd"`
	AmountCrypto    *float64  `json:"amount_crypto,omitempty" db:"amount_crypto"`
	Currency        string    `json:"currency" db:"currency"`
	TxHash          *string   `json:"tx_hash,omitempty" db:"tx_hash"`
	Status          string    `json:"status" db:"status"`
	NextPaymentDate *string   `json:"next_payment_date,omitempty" db:"next_payment_date"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

type SIWEMessage struct {
	Address    string `json:"address"`
	ChainID    int    `json:"chain_id"`
	Domain     string `json:"domain"`
	URI        string `json:"uri"`
	Version    string `json:"version"`
	Nonce      string `json:"nonce"`
	IssuedAt   string `json:"issued_at"`
}

type AuthRequest struct {
	Message   string `json:"message"`
	Signature string `json:"signature"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

type ServiceCreateRequest struct {
	Title           string         `json:"title"`
	Description     string         `json:"description"`
	Category        string         `json:"category"`
	PriceUSD        float64        `json:"price_usd"`
	CoverageAmount  float64        `json:"coverage_amount"`
	CoverageDetails map[string]interface{} `json:"coverage_details"`
	DurationDays    *int           `json:"duration_days,omitempty"`
	MaxMembers      *int           `json:"max_members,omitempty"`
}

type ClaimCreateRequest struct {
	Amount      float64  `json:"amount"`
	Description string   `json:"description"`
	EvidenceUrls []string `json:"evidence_urls"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PerPage    int         `json:"per_page"`
	TotalPages int         `json:"total_pages"`
}

type LockDetails struct {
	Address            string `json:"address"`
	Name               string `json:"name"`
	TokenAddress       string `json:"tokenAddress"`
	TotalKeys          int    `json:"totalKeys"`
	OutstandingKeys    int    `json:"outstandingKeys"`
	MaxNumberOfKeys    int    `json:"maxNumberOfKeys"`
	ExpirationDuration int    `json:"expirationDuration"`
	KeyPrice           string `json:"keyPrice"`
	Balance            string `json:"balance"`
	CreatedBlockNumber int    `json:"createdBlockNumber"`
}

type KeyHolder struct {
	ID         string `json:"id"`
	Lock       string `json:"lock"`
	Owner      string `json:"owner"`
	Expiration int64  `json:"expiration"`
	TokenID    string `json:"tokenID"`
}

type LinkLockRequest struct {
	LockAddress string `json:"lock_address"`
	NetworkID   int    `json:"network_id"`
}
