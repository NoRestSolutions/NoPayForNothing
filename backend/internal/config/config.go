package config

import (
	"os"
	"strconv"
)

type Config struct {
	ServerPort    string
	DatabaseURL   string
	JWTSecret     string
	UnlockAppURL  string
	LocksmithURL  string
	SubgraphURL   string
	PolygonRPC    string
	ChainID       int
	FrontendURL   string
}

func Load() *Config {
	return &Config{
		ServerPort:   getEnv("SERVER_PORT", "8080"),
		DatabaseURL:  getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/securemarket?sslmode=disable"),
		JWTSecret:    getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		UnlockAppURL: getEnv("UNLOCK_APP_URL", "https://app.unlock-protocol.com"),
		LocksmithURL: getEnv("LOCKSMITH_URL", "https://locksmith.unlock-protocol.com"),
		SubgraphURL:  getEnv("SUBGRAPH_URL", "https://subgraph.unlock-protocol.com/137"),
		PolygonRPC:   getEnv("POLYGON_RPC", "https://rpc.unlock-protocol.com/137"),
		ChainID:      getEnvInt("CHAIN_ID", 137),
		FrontendURL:  getEnv("FRONTEND_URL", "http://localhost:5173"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value, exists := os.LookupEnv(key); exists {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return fallback
}
