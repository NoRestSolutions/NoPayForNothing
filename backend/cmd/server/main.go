package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/securemarket/backend/internal/config"
	"github.com/securemarket/backend/internal/database"
	"github.com/securemarket/backend/internal/handlers"
	"github.com/securemarket/backend/internal/middleware"
)

func main() {
	cfg := config.Load()

	// Initialize database
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Run migrations if flag is set
	if os.Getenv("RUN_MIGRATIONS") == "true" {
		if err := database.RunMigrations(); err != nil {
			log.Printf("Warning: migrations failed: %v", err)
		}
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg.JWTSecret, cfg.FrontendURL)
	providerHandler := handlers.NewProviderHandler()
	serviceHandler := handlers.NewServiceHandler()
	contractHandler := handlers.NewContractHandler()
	claimHandler := handlers.NewClaimHandler()
	webhookHandler := handlers.NewWebhookHandler()

	// Setup router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.CORSMiddleware(cfg.FrontendURL))

	// API v1 routes
	r.Route("/api/v1", func(r chi.Router) {
		// Public routes
		r.Route("/auth", authHandler.Routes)
		r.Route("/providers", providerHandler.Routes)
		r.Route("/services", serviceHandler.Routes)

		// Webhook routes (no auth required)
		r.Route("/webhooks", webhookHandler.Routes)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.AuthMiddleware(cfg.JWTSecret))
			r.Route("/contracts", contractHandler.Routes)
			r.Route("/claims", claimHandler.Routes)
		})
	})

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Start server
	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("Server starting on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
