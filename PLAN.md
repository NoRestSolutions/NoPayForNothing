# SecureMarket - Blockchain-Backed Service Guarantees Platform

## Overview

A marketplace where service providers (mechanics, doctors, dentists, etc.) offer **secure service contracts** as blockchain memberships using Unlock Protocol. Customers subscribe to these guarantees, creating a digital contract signed on the Polygon blockchain.

### Example Use Cases
- **Mechanic**: Offers car repair guarantee (max $2000 coverage, $20/month subscription)
- **Doctor**: Offers health service guarantee (diabetes treatment, max $3000/person, $50/month)
- **Dentist**: Offers dental care plan (routine + emergency, $40/month)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │ Landing  │  │Provider  │  │ Customer │  │  Dashboard &     ││
│  │  Page    │  │Dashboard │  │ Portal   │  │  Contract Mgmt   ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
│                     │              │               │             │
│              ┌──────┴──────────────┴───────────────┴──────┐     │
│              │         Paywall (Unlock.js)                 │     │
│              │    - Wallet Connection (SIWE)               │     │
│              │    - Key Purchase Flow                      │     │
│              │    - Subscription Management                │     │
│              └────────────────────────────────────────────┘     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────┴─────────────────────────────────────┐
│                     GO BACKEND (REST API)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │ Provider │  │ Contract │  │ Payment  │  │  Webhook         ││
│  │ Service  │  │ Service  │  │ Service  │  │  Handler         ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
│                     │              │               │             │
│  ┌──────────────────┴──────────────┴───────────────┴───────┐    │
│  │              PostgreSQL Database                         │    │
│  │  providers | services | contracts | subscriptions       │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                   POLYGON BLOCKCHAIN                            │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │  Unlock Protocol     │    │  Locksmith API (hosted)      │   │
│  │  - PublicLock NFTs   │    │  - Metadata storage          │   │
│  │  - Key management    │    │  - Webhooks                  │   │
│  │  - Subscription      │    │  - Fiat integration          │   │
│  └──────────────────────┘    └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (PostgreSQL)

```sql
-- Users table (both providers and customers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('provider', 'customer', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider profiles
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    total_contracts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services offered by providers
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    lock_address VARCHAR(42),
    network_id INTEGER DEFAULT 137,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    coverage_amount DECIMAL(12,2) NOT NULL,
    coverage_details JSONB,
    duration_days INTEGER,
    max_members INTEGER,
    active_members INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contracts (signed agreements)
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id),
    provider_id UUID REFERENCES providers(id),
    key_id VARCHAR(255),
    lock_address VARCHAR(42),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'expired', 'terminated', 'claimed')),
    terms JSONB NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claims made against contracts
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    evidence_urls TEXT[],
    resolved_at TIMESTAMP WITH TIME ZONE,
    payout_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription payments tracking
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    user_id UUID REFERENCES users(id),
    amount_usd DECIMAL(10,2) NOT NULL,
    amount_crypto DECIMAL(18,8),
    currency VARCHAR(10) DEFAULT 'USDC',
    tx_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled')),
    next_payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_services_provider ON services(provider_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_service ON contracts(service_id);
CREATE INDEX idx_users_wallet ON users(wallet_address);
```

---

## Go Backend API Structure

```
cmd/
  server/
    main.go                 # Entry point, server setup
internal/
  handlers/
    auth.go                 # SIWE authentication
    providers.go            # Provider CRUD
    services.go             # Service management
    contracts.go            # Contract operations
    claims.go               # Claims processing
    webhooks.go             # Unlock webhook handlers
  middleware/
    auth.go                 # JWT/SIWE middleware
    cors.go                 # CORS configuration
  models/
    user.go
    provider.go
    service.go
    contract.go
    claim.go
  services/
    unlock.go               # Unlock.js integration via Node subprocess
    web3.go                 # Ethereum interactions
    locksmith.go            # Locksmith API client
  database/
    postgres.go             # DB connection and queries
  config/
    config.go               # Environment configuration
pkg/
  unlock/
    client.go               # Unlock protocol client
    paywall.go              # Paywall configuration generator
api/
  v1/
    routes.go               # API route definitions
go.mod
go.sum
```

### Key API Endpoints

```
POST   /api/v1/auth/siwe              # Sign-In with Ethereum
GET    /api/v1/auth/me                # Get current user

GET    /api/v1/providers              # List providers
GET    /api/v1/providers/:id          # Get provider details
POST   /api/v1/providers              # Create provider profile
PUT    /api/v1/providers/:id          # Update provider

GET    /api/v1/services               # List all services
GET    /api/v1/services/:id           # Get service details
POST   /api/v1/services               # Create new service
PUT    /api/v1/services/:id           # Update service
DELETE /api/v1/services/:id           # Archive service

GET    /api/v1/contracts              # List user's contracts
GET    /api/v1/contracts/:id          # Get contract details
POST   /api/v1/contracts              # Initiate contract
POST   /api/v1/contracts/:id/terminate

POST   /api/v1/contracts/:id/claims   # File a claim
GET    /api/v1/claims                 # List claims
PUT    /api/v1/claims/:id/approve     # Approve claim
PUT    /api/v1/claims/:id/reject      # Reject claim

POST   /api/v1/webhooks/unlock        # Handle key purchases
POST   /api/v1/webhooks/locksmith     # Handle payments

GET    /api/v1/paywall/:serviceId     # Generate paywall config
```

---

## Unlock Protocol Integration

### Service Provider Flow (Lock Creation)
```
Provider → Creates Service in App → App deploys Lock via Unlock.js
                                   → Lock stores service terms as metadata
                                   → Returns lock_address to provider
```

### Customer Subscription Flow (Key Purchase)
```
Customer → Selects Service → Redirected to Unlock Checkout
         → Pays with USDC on Polygon → Receives Key NFT
         → Webhook confirms → Contract activated in DB
         → Access granted to service benefits
```

### Go Backend ↔ Unlock Integration
- **Locksmith API**: Direct HTTP calls for metadata, webhooks
- **Subgraph Queries**: GraphQL for on-chain data
- **RPC Provider**: Direct contract calls via `ethclient`

### Metadata Strategy
```json
{
  "service": {
    "title": "Car Repair Guarantee",
    "coverage": 2000,
    "terms": "Covers all repairs up to $2000...",
    "provider": "0x..."
  }
}
```

---

## Frontend Structure (React + Vite)

```
src/
  components/
    layout/
      Header.tsx
      Footer.tsx
      Sidebar.tsx
    auth/
      WalletConnect.tsx
      AuthGuard.tsx
    providers/
      ProviderCard.tsx
      ProviderList.tsx
      ProviderDashboard.tsx
    services/
      ServiceCard.tsx
      ServiceList.tsx
      ServiceCreate.tsx
      ServiceDetail.tsx
    contracts/
      ContractCard.tsx
      ContractList.tsx
      ContractDetail.tsx
    claims/
      ClaimForm.tsx
      ClaimList.tsx
    paywall/
      PaywallModal.tsx
  hooks/
    useUnlock.ts
    useContracts.ts
    useAuth.ts
  pages/
    Landing.tsx
    Providers.tsx
    ProviderProfile.tsx
    Services.tsx
    ServiceDetail.tsx
    Dashboard.tsx
    ProviderDashboard.tsx
    ContractDetail.tsx
  lib/
    unlock.ts
    api.ts
    contracts.ts
  config/
    networks.ts
    locks.ts
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, TailwindCSS |
| Backend | Go 1.22+, Chi router, pgx (PostgreSQL) |
| Database | PostgreSQL 16 |
| Blockchain | Polygon (Chain ID: 137) |
| Web3 | go-ethereum, Unlock.js (Node subprocess) |
| Auth | SIWE (EIP-4361) |
| API | REST, JSON |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Go backend setup with PostgreSQL
- Basic auth with SIWE
- Provider/service CRUD APIs
- React app with routing and wallet connection

### Phase 2: Unlock Integration (Week 3-4)
- Lock deployment via Unlock.js
- Paywall integration on frontend
- Webhook handlers for key events
- Metadata storage via Locksmith

### Phase 3: Core Features (Week 5-6)
- Contract management
- Claim system
- Provider/customer dashboards
- Search and filtering

### Phase 4: Polish (Week 7-8)
- Recurring payment automation
- Notifications
- Admin panel
- Testing and deployment
