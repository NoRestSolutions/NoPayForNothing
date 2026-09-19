# NoPayForNothing

Blockchain-backed service guarantees powered by Unlock Protocol on Sepolia.

## Overview

NoPayForNothing is a marketplace where service providers (mechanics, doctors, cleaners, etc.) offer blockchain-backed service guarantee subscriptions. Customers subscribe to services and receive NFT-based guarantees that can be enforced through a claims system.

## Architecture

### Backend (Go)
- **API Framework**: Chi router
- **Database**: PostgreSQL
- **Authentication**: SIWE (Sign-In with Ethereum) + JWT
- **Blockchain**: Unlock Protocol on Sepolia

### Frontend (React)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with Inter font (Unlock Protocol style)
- **Routing**: React Router v6
- **Icons**: Lucide React

## Features

- Wallet connection (MetaMask, Coinbase, WalletConnect)
- Browse service providers by category
- Subscribe to blockchain-backed guarantees
- View active subscriptions in dashboard
- File and track claims
- Responsive design (mobile, tablet, desktop)

## Setup

### Prerequisites
- Go 1.22+
- Node.js 18+
- PostgreSQL 16+

### Database

Start PostgreSQL:
```bash
docker-compose up -d
```

Run migrations:
```bash
psql -U postgres -d nopayfornothing -f database/migrations/001_initial.sql
```

### Backend

```bash
cd backend
go mod download
cp .env.example .env  # Configure environment
go run cmd/server/main.go
```

The API server starts on http://localhost:8080

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on http://localhost:5173

## Project Structure

```
nopayfornothing/
├── backend/
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── database/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   └── models/
│   └── pkg/unlock/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── config/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── pages/
│   └── index.html
└── database/
    └── migrations/
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/siwe | Authenticate with SIWE |
| GET | /api/providers | List service providers |
| GET | /api/providers/:id | Get provider details |
| GET | /api/services | List services |
| GET | /api/services/:id | Get service details |
| POST | /api/contracts | Create subscription |
| GET | /api/contracts | List user contracts |
| POST | /api/claims | File a claim |
| GET | /api/claims | List user claims |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 8080 |
| DATABASE_URL | PostgreSQL connection | postgres://postgres:postgres@localhost:5432/nopayfornothing |
| JWT_SECRET | JWT signing secret | change-me-in-production |
| LOCKSMITH_API_KEY | Unlock Protocol API key | |
| LOCKSMITH_API_SECRET | Unlock Protocol API secret | |

## License

MIT
