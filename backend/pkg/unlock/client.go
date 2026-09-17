package unlock

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type PaywallConfig struct {
	Locks       map[string]LockConfig `json:"locks"`
	Network     int                   `json:"network"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	Pessimistic bool                  `json:"pessimistic,omitempty"`
}

type LockConfig struct {
	Name             string `json:"name"`
	Address          string `json:"address"`
	Network          int    `json:"network"`
	Repeat           int    `json:"repeat,omitempty"`
	MaxUsers         int    `json:"maxUsers,omitempty"`
	MultiCurrency    bool   `json:"multiCurrency,omitempty"`
}

type LocksmithService struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewLocksmithService(baseURL string) *LocksmithService {
	return &LocksmithService{
		BaseURL:    baseURL,
		HTTPClient: &http.Client{},
	}
}

func (s *LocksmithService) GetLockMetadata(network int, lockAddress string) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/v1/metadata/%d/%s", s.BaseURL, network, lockAddress)

	resp, err := s.HTTPClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch metadata: %w", err)
	}
	defer resp.Body.Close()

	var metadata map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&metadata); err != nil {
		return nil, fmt.Errorf("failed to decode metadata: %w", err)
	}

	return metadata, nil
}

func (s *LocksmithService) UpdateLockMetadata(network int, lockAddress string, metadata map[string]interface{}) error {
	url := fmt.Sprintf("%s/api/v1/metadata/%d/%s", s.BaseURL, network, lockAddress)

	body, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	req, err := http.NewRequest(http.MethodPut, url, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to update metadata: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to update metadata: status %d", resp.StatusCode)
	}

	return nil
}

func (s *LocksmithService) GetKeyMetadata(network int, lockAddress string, keyID string) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/v1/metadata/%d/%s/keys/%s", s.BaseURL, network, lockAddress, keyID)

	resp, err := s.HTTPClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch key metadata: %w", err)
	}
	defer resp.Body.Close()

	var metadata map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&metadata); err != nil {
		return nil, fmt.Errorf("failed to decode key metadata: %w", err)
	}

	return metadata, nil
}

func (s *LocksmithService) SendEmail(to, subject, body string) error {
	url := fmt.Sprintf("%s/api/v1/email", s.BaseURL)

	payload := map[string]string{
		"to":      to,
		"subject": subject,
		"body":    body,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %w", err)
	}

	resp, err := s.HTTPClient.Post(url, "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to send email: status %d", resp.StatusCode)
	}

	return nil
}

type PaywallConfigGenerator struct {
	FrontendURL string
}

func NewPaywallConfigGenerator(frontendURL string) *PaywallConfigGenerator {
	return &PaywallConfigGenerator{
		FrontendURL: frontendURL,
	}
}

func (g *PaywallConfigGenerator) GenerateForService(lockAddress string, network int, serviceTitle string) *PaywallConfig {
	return &PaywallConfig{
		Locks: map[string]LockConfig{
			lockAddress: {
				Name:    serviceTitle,
				Address: lockAddress,
				Network: network,
			},
		},
		Network:     network,
		Pessimistic: false,
	}
}

func (g *PaywallConfigGenerator) GenerateCheckoutURL(config *PaywallConfig) string {
	configJSON, _ := json.Marshal(config)
	encoded := string(configJSON)
	return fmt.Sprintf("https://app.unlock-protocol.com/checkout?paywallConfig=%s", encoded)
}
