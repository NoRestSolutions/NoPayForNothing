package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"
	"github.com/securemarket/backend/internal/config"
	"github.com/securemarket/backend/internal/database"
	"github.com/securemarket/backend/internal/handlers"
	"github.com/securemarket/backend/internal/middleware"
)

func main() {
	godotenv.Load()
	cfg := config.Load()

	// Initialize database
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Run migrations and seed data on startup
	if err := database.RunMigrations(); err != nil {
		log.Printf("Notice on database migration: %v", err)
	}

	// Initialize handlers with JWT Secret
	authHandler := handlers.NewAuthHandler(cfg.JWTSecret, cfg.FrontendURL)
	providerHandler := handlers.NewProviderHandler(cfg.JWTSecret)
	serviceHandler := handlers.NewServiceHandler(cfg.JWTSecret)
	contractHandler := handlers.NewContractHandler()
	claimHandler := handlers.NewClaimHandler()
	webhookHandler := handlers.NewWebhookHandler()

	// Setup router
	r := chi.NewRouter()

	// Global CORS Middleware
	r.Use(middleware.CORSMiddleware(cfg.FrontendURL))

	// API v1 routes
	r.Route("/api/v1", func(r chi.Router) {
		// Public & self-authenticating routes
		r.Route("/auth", authHandler.Routes)
		r.Route("/providers", providerHandler.Routes)
		r.Route("/services", serviceHandler.Routes)

		// Webhook routes
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
