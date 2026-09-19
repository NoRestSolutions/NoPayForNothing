# Plan: Compra de Locks, Creación de Servicio y Login con Wallet

## Análisis del Proyecto

**NoPayForNothing** (LockProtocol) es un marketplace de servicios con garantías blockchain usando Unlock Protocol en Sepolia testnet (chainId 11155111).

### Stack Actual
| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Go 1.22+ (Chi router) |
| Database | PostgreSQL 16 |
| Blockchain | Sepolia Testnet |
| Auth | SIWE (EIP-4361) + JWT |
| Web3 | ethers.js v5 + Unlock.js |

### Estado Actual del Código
- **Backend funcional**: Auth SIWE, CRUD providers/services/contracts, webhooks
- **Frontend funcional**: Login MetaMask, SIWE, dashboard provider/cliente, LockManager
- **Unlock Integration**: Factory deploy en frontend (`deployLock`), subgraph queries en backend, checkout URL
- **Base de datos**: Migración 001_initial.sql con tablas users, providers, services, contracts, claims, subscriptions

### Flujo Actual (LockManager)
1. Provider crea servicio via `POST /api/v1/services`
2. Provider va a LockManager y despliega un Lock via `deployLock()` (frontend, vía Unlock Factory en Sepolia)
3. Lock se vincula al servicio via `PUT /api/v1/locks/{serviceId}/link`
4. Customer compra Key (NFT) via `openUnlockCheckout()` → redirect a Unlock Checkout
5. Webhook `key purchased` activa el contrato en DB

---

## Plan de Ejecución

### Fase 1: Levantar la Base de Datos
**Objetivo**: PostgreSQL corriendo con el schema inicial.

1. Levantar PostgreSQL via Docker Compose:
   ```bash
   cd ~/Jobs/NoRest/LockProtocol
   docker-compose up -d
   ```
2. Verificar que la DB `nopayfornothing` existe y el schema se aplicó automáticamente (el docker-compose monta `001_initial.sql` en `/docker-entrypoint-initdb.d/`)
3. Verificar tablas:
   ```bash
   docker exec -it nopayfornothing-db psql -U postgres -d nopayfornothing -c "\dt"
   ```

### Fase 2: Crear un Servicio de Prueba
**Objetivo**: Tener un servicio creado en la DB para poder comprarle un Lock.

**Opción A** (via API, requiere backend corriendo):
1. Levantar el backend Go
2. Login con wallet (SIWE) para obtener JWT
3. `POST /api/v1/services` con datos del servicio

**Opción B** (via SQL directo, más rápido para testing):
```sql
-- Crear usuario provider
INSERT INTO users (id, wallet_address, role)
VALUES ('test-provider-001', '0x...', 'provider');

-- Crear provider profile
INSERT INTO providers (id, user_id, business_name, category, description, rating, verified)
VALUES ('provider-001', 'test-provider-001', 'Taller Mecánico ABC', 'mechanic', 'Servicios de reparación automotriz con garantía blockchain', 5.0, true);

-- Crear servicio
INSERT INTO services (id, provider_id, title, description, category, price_usd, coverage_amount, coverage_details, duration_days)
VALUES ('service-001', 'provider-001', 'Reparación Motor - Garantía 30 días', 'Cubrimos reparaciones de motor hasta $2000 USD por 30 días', 'mechanic', 0.01, 2000.00, '{"items": ["Diagnóstico", "Reparación", "Repuestos"]}', 30);
```

### Fase 3: Desplegar el Lock (Comprar Lock)
**Objetivo**: Crear un Lock en Sepolia que represente la suscripción al servicio.

**Flujo via Frontend (LockManager)**:
1. Abrir frontend (`npm run dev`)
2. Conectar wallet MetaMask en Sepolia
3. Ir a `/dashboard/locks`
4. Click "Crear Nuevo Lock"
5. Configurar: nombre, precio (en ETH), duración, max keys
6. Confirmar transacción en MetaMask
7. El Lock se despliega via Unlock Factory (`0x5CB01388D95B7c8c56D4fcC0B6Fc665B60443200`)
8. Vincular Lock al servicio creado

**Flujo via Contrato Directo** (sin frontend):
1. Conectar a Sepolia RPC
2. Llamar `createLock()` en Unlock Factory
3. Extraer lock address del evento `LockCreated`
4. Vincular via API `PUT /api/v1/locks/{serviceId}/link`

### Fase 4: Login con Wallet (SIWE)
**Objetivo**: Autenticar usuario con MetaMask.

1. Abrir frontend en `http://localhost:5173`
2. Click "Conectar Billetera" o ir a `/wallet-connect`
3. MetaMask pide conexión (`eth_requestAccounts`)
4. Frontend solicita nonce al backend (`GET /api/v1/auth/nonce?address=0x...`)
5. Frontend construye mensaje EIP-4361 (SIWE)
6. Usuario firma con MetaMask
7. Backend verifica firma criptográfica
8. Backend crea/busca usuario en PostgreSQL
9. Backend emite JWT
10. Frontend almacena JWT y redirige al dashboard

### Fase 5: Comprar Key (Suscribirse al Servicio)
**Objetivo**: Un customer compra una Key (NFT) del Lock, activando la suscripción.

1. Customer navega al servicio
2. Click "Suscribirse" → `openUnlockCheckout(lockAddress, serviceTitle)`
3. Unlock Checkout abre en nueva pestaña
4. Customer paga con ETH/USDC en Sepolia
5. Webhook notifica al backend (`POST /api/v1/webhooks/unlock`)
6. Backend activa el contrato en DB (`status: 'pending' → 'active'`)
7. Se crea registro en tabla `subscriptions`

---

## Archivos Clave a Revisar/Modificar

| Archivo | Función |
|---------|---------|
| `backend/cmd/server/main.go` | Entry point del servidor |
| `backend/internal/handlers/auth.go` | SIWE + JWT |
| `backend/internal/handlers/services.go` | CRUD servicios |
| `backend/internal/handlers/locks.go` | Lock queries + link |
| `backend/internal/database/database.go` | Conexión PostgreSQL |
| `frontend/src/context/AuthContext.tsx` | Login MetaMask + SIWE |
| `frontend/src/lib/unlock.ts` | deployLock + openUnlockCheckout |
| `frontend/src/lib/api.ts` | Cliente API |
| `frontend/src/pages/LockManager.tsx` | UI de gestión de locks |
| `database/migrations/001_initial.sql` | Schema de DB |

---

## Prerrequisitos

- MetaMask instalado con Sepolia testnet configurado
- ETH de testnet en Sepolia (faucet: https://sepoliafaucet.com)
- Docker corriendo (para PostgreSQL)
- Go 1.22+ instalado
- Node.js 18+ instalado
