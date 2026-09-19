package database

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func Connect(databaseURL string) error {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return fmt.Errorf("unable to parse database config: %w", err)
	}

	config.MaxConns = 20
	config.MinConns = 5

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return fmt.Errorf("unable to create connection pool: %w", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		return fmt.Errorf("unable to ping database: %w", err)
	}

	DB = pool
	return nil
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}

func RunMigrations() error {
	migrationFile := "../database/migrations/001_initial.sql"
	content, err := os.ReadFile(migrationFile)
	if err != nil {
		return fmt.Errorf("unable to read migration file: %w", err)
	}

	_, err = DB.Exec(context.Background(), string(content))
	if err != nil {
		return fmt.Errorf("unable to run migration: %w", err)
	}

	return nil
}
