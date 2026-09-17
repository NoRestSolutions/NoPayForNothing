package unlock

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type SubgraphService struct {
	Endpoint string
}

func NewSubgraphService(endpoint string) *SubgraphService {
	return &SubgraphService{
		Endpoint: endpoint,
	}
}

type Lock struct {
	Address             string `json:"address"`
	Name                string `json:"name"`
	TokenAddress        string `json:"tokenAddress"`
	TotalKeys           int    `json:"totalKeys"`
	OutstandingKeys     int    `json:"outstandingKeys"`
	MaxNumberOfKeys     int    `json:"maxNumberOfKeys"`
	ExpirationDuration  int    `json:"expirationDuration"`
	KeyPrice            string `json:"keyPrice"`
	Balance             string `json:"balance"`
	CreatedBlockNumber  int    `json:"createdBlockNumber"`
}

type Key struct {
	ID            string `json:"id"`
	Lock          string `json:"lock"`
	Owner         string `json:"owner"`
	Expiration    int64  `json:"expiration"`
	TokenID       string `json:"tokenID"`
	CreatedBlock  int    `json:"createdBlockNumber"`
}

type LockQueryResponse struct {
	Data struct {
		Locks []Lock `json:"locks"`
	} `json:"data"`
}

type KeyQueryResponse struct {
	Data struct {
		Keys []Key `json:"keys"`
	} `json:"data"`
}

func (s *SubgraphService) QueryLocks(first, skip int, network int) ([]Lock, error) {
	query := fmt.Sprintf(`{
		locks(first: %d, skip: %d, orderBy: createdBlockNumber, orderDirection: desc) {
			address
			name
			tokenAddress
			totalKeys
			outstandingKeys
			maxNumberOfKeys
			expirationDuration
			keyPrice
			balance
			createdBlockNumber
		}
	}`, first, skip)

	return s.executeLockQuery(query)
}

func (s *SubgraphService) QueryLockByAddress(address string) (*Lock, error) {
	query := fmt.Sprintf(`{
		locks(where: { address: "%s" }) {
			address
			name
			tokenAddress
			totalKeys
			outstandingKeys
			maxNumberOfKeys
			expirationDuration
			keyPrice
			balance
			createdBlockNumber
		}
	}`, address)

	locks, err := s.executeLockQuery(query)
	if err != nil {
		return nil, err
	}
	if len(locks) == 0 {
		return nil, fmt.Errorf("lock not found")
	}
	return &locks[0], nil
}

func (s *SubgraphService) QueryKeysByLock(lockAddress string, first, skip int) ([]Key, error) {
	query := fmt.Sprintf(`{
		keys(first: %d, skip: %d, where: { lock: "%s" }, orderBy: createdBlockNumber, orderDirection: desc) {
			id
			lock
			owner
			expiration
			tokenID
			createdBlockNumber
		}
	}`, first, skip, lockAddress)

	return s.executeKeyQuery(query)
}

func (s *SubgraphService) QueryKeysByOwner(ownerAddress string, network int) ([]Key, error) {
	query := fmt.Sprintf(`{
		keys(where: { owner: "%s" }, orderBy: createdBlockNumber, orderDirection: desc) {
			id
			lock
			owner
			expiration
			tokenID
			createdBlockNumber
		}
	}`, ownerAddress)

	return s.executeKeyQuery(query)
}

func (s *SubgraphService) executeLockQuery(query string) ([]Lock, error) {
	payload := map[string]string{
		"query": query,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal query: %w", err)
	}

	resp, err := http.Post(s.Endpoint, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var response LockQueryResponse
	if err := json.Unmarshal(respBody, &response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return response.Data.Locks, nil
}

func (s *SubgraphService) executeKeyQuery(query string) ([]Key, error) {
	payload := map[string]string{
		"query": query,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal query: %w", err)
	}

	resp, err := http.Post(s.Endpoint, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var response KeyQueryResponse
	if err := json.Unmarshal(respBody, &response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return response.Data.Keys, nil
}
