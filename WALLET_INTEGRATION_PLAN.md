# Plan de Integración de Billeteras Digitales (Web3) - NoPayForNothing

Este documento detalla el plan técnico, arquitectónico y operativo para conectar el backend (Go) y frontend (React + TypeScript) de **NoPayForNothing** a billeteras digitales como MetaMask, Coinbase Wallet, WalletConnect y soluciones de Smart Wallets.

---

## 1. 🎯 Objetivos de la Integración

1. **Autenticación Descentralizada (SIWE - EIP-4361)**: Permitir a clientes y proveedores iniciar sesión y registrarse firmando un reto criptográfico con su billetera, sin necesidad de contraseñas tradicionales.
2. **Soporte Multi-Wallet**: Permitir la conexión fluida tanto a usuarios de extensiones (MetaMask, Rabby), como de navegadores móviles (Coinbase Wallet, Rainbow, Trust Wallet vía WalletConnect), y usuarios no nativos de Web3 (Smart Wallets / Passkeys).
3. **Interacción con Polygon & Unlock Protocol**: Preparar la capa Web3 para desplegar cerraduras (*Locks*), comprar membresías (*Keys / NFTs*) y verificar la tenencia de garantías de servicios.
4. **Seguridad y Prevención de Ataques**: Implementar validación de Nonce (Anti-Replay), verificación de dominio, comprobación de Chain ID (Polygon 137 / Amoy 80002) y normalización de direcciones en PostgreSQL.

---

## 2. 💡 Análisis y Recomendación de Billeteras

| Billetera / Proveedor | Tipo | Perfil de Usuario | Nivel de Recomendación | Justificación |
| :--- | :--- | :--- | :--- | :--- |
| **MetaMask** | Extensión Web & App Móvil | Cripto-nativo / Desktop | ⭐⭐⭐⭐⭐ **(Imprescindible)** | Es el estándar de la industria en EVM (Ethereum / Polygon). Utiliza inyección `window.ethereum` (EIP-1193). |
| **Coinbase Wallet** | Extensión & Smart Wallet | Cripto & No-cripto | ⭐⭐⭐⭐⭐ **(Imprescindible)** | Excelente experiencia móvil y soporte pionero para **Passkeys / FaceID** (Account Abstraction ERC-4337). |
| **WalletConnect / AppKit (Reown)** | Protocolo de conexión QR | Móvil multi-billetera | ⭐⭐⭐⭐⭐ **(Imprescindible)** | Permite conectar más de 300 billeteras móviles (Rainbow, Trust Wallet, Ledger, Argent) escaneando un código QR. |
| **Privy / Web3Auth** | Embedded Wallets | Usuario común Web2 | ⭐⭐⭐⭐⭐ **(Recomendado a futuro)** | Permite crear una billetera en Polygon asociada a un correo de Google/Apple sin necesidad de frase de recuperación. |
| **Unlock Protocol Checkout** | Pasarela de Pago Web3/Fiat | Clientes de Servicios | ⭐⭐⭐⭐ **(Integrada en el Core)** | Permite a los clientes pagar las membresías con tarjeta de crédito o criptomonedas (USDC/POL) directamente. |

> **Decisión Recomendada:** Usar un enfoque modular con **EIP-1193 / Ethers v5/v6 + SIWE** en Frontend y **`siwe-go`** en el Backend de Go, permitiendo soportar MetaMask, Coinbase y WalletConnect de forma nativa.

---

## 3. 🏗️ Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + TS)                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Wallet Provider Layer                         │  │
│  │     - window.ethereum (MetaMask / EIP-1193)                      │  │
│  │     - WalletConnect / Coinbase SDK                               │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
│                                    │ 1. Solicitud de cuentas           │
│                                    ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   Hook de Autenticación (useAuth)                │  │
│  │   2. Solicita Nonce ──► 3. Construye SIWE ──► 4. Firma personal  │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │ HTTPS (JSON: message + signature)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Go + Chi)                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   Auth Handler (/api/v1/auth)                    │  │
│  │   - GET  /nonce : Genera nonce único con TTL                     │  │
│  │   - POST /siwe  : Valida firma criptográfica (siwe-go)           │  │
│  │   - GET  /me    : Retorna perfil del usuario autenticado         │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
│                                    │                                   │
│                                    ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     PostgreSQL Database                          │  │
│  │     - users (id, wallet_address [LOWER], role, created_at)       │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
│                                    │                                   │
│                                    ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               Emisión de Token JWT Seguro                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 📝 Hoja de Ruta de Implementación Paso a Paso

### 📦 Paso 1: Backend (Go)

1. **Instalar Dependencias de Web3 y SIWE**:
   ```bash
   cd backend
   go get github.com/spruceid/siwe-go
   go get github.com/ethereum/go-ethereum
   ```

2. **Crear Gestor de Nonces en Memoria/Caché**:
   - Generar un código criptográficamente seguro (alfanumérico de 16-32 caracteres).
   - Guardar en un almacén con tiempo de expiración (5 minutos).
   - Endpoint: `GET /api/v1/auth/nonce?address=0x...`

3. **Actualizar el Handler de Autenticación (`internal/handlers/auth.go`)**:
   - Parsear el mensaje EIP-4361 con `siwe.ParseMessage(req.Message)`.
   - Verificar la firma contra el `nonce`, `domain` y `chainId`.
   - Recuperar la dirección pública firmante (`strings.ToLower(parsedMessage.GetAddress().Hex())`).
   - Buscar o insertar en PostgreSQL (`INSERT INTO users (wallet_address, role) ... ON CONFLICT`).
   - Firmar y devolver el JWT con `user_id` y `wallet_address`.

---

### 💻 Paso 2: Frontend (React + TypeScript)

1. **Actualizar Cliente API (`frontend/src/lib/api.ts`)**:
   - Agregar método `getNonce(address: string): Promise<{ nonce: string }>`.
   - Ajustar `signInWithEthereum(message: string, signature: string)`.

2. **Actualizar Hook de Autenticación (`frontend/src/hooks/useAuth.ts`)**:
   - Detectar proveedor Web3 inyectado (`window.ethereum`).
   - Pedir permisos de cuenta: `eth_requestAccounts`.
   - Construir mensaje EIP-4361 con:
     - `domain`: `window.location.host`
     - `address`: Dirección conectada
     - `statement`: Texto de bienvenida / términos
     - `uri`: `window.location.origin`
     - `version`: "1"
     - `chainId`: `137` (Polygon Mainnet) o `80002` (Amoy Testnet)
     - `nonce`: Obtenido del backend
     - `issuedAt`: Timestamp ISO
   - Solicitar firma personal: `signer.signMessage(message)` o `eth_signTypedData_v4`.
   - Transmitir la firma al backend y guardar el JWT resultante.

3. **Actualizar Componente UI (`frontend/src/components/auth/WalletConnect.tsx`)**:
   - Reemplazar el generador simulado (`mockAddress`) con la llamada real a MetaMask y proveedores Web3.
   - Mostrar estado de carga (*Signing...*, *Connecting...*).
   - Manejar errores comunes (Rechazo de firma por el usuario, wallet no instalada, red incorrecta).
   - Agregar botón para cambiar automáticamente a la red Polygon si el usuario está en Ethereum Mainnet u otra red.

4. **Detección de Eventos de Billetera**:
   - Escuchar `accountsChanged`: cerrar sesión o refrescar cuando el usuario cambie de cuenta en MetaMask.
   - Escuchar `chainChanged`: recargar o alertar para evitar transacciones en la red equivocada.

---

### 🌐 Paso 3: Configuración de Redes (Polygon)

Archivo de configuración recomendado para Frontend (`src/config/networks.ts`):

```typescript
export const POLYGON_MAINNET = {
  chainId: '0x89', // 137 en hexadecimal
  chainName: 'Polygon Mainnet',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: ['https://polygon-rpc.com/'],
  blockExplorerUrls: ['https://polygonscan.com/'],
};

export const POLYGON_AMOY_TESTNET = {
  chainId: '0x13882', // 80002
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: ['https://rpc-amoy.polygon.technology/'],
  blockExplorerUrls: ['https://amoy.polygonscan.com/'],
};
```

Función para cambio automático de red en MetaMask:
```typescript
export async function switchToPolygon() {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_MAINNET.chainId }],
    });
  } catch (switchError: any) {
    // Si la red no está agregada en MetaMask, la agregamos
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [POLYGON_MAINNET],
      });
    }
  }
}
```

---

## 5. 🛡️ Matriz de Seguridad y Checklist

- [x] **Nonces Únicos con TTL**: Los nonces se invalidan tras 5 minutos o tras su primer uso.
- [x] **Normalización de Direcciones**: Todas las direcciones se almacenan en minúsculas en PostgreSQL.
- [x] **Comprobación de Dominio**: El backend valida que el dominio del mensaje SIWE corresponda exactamente a la URL autorizada del frontend.
- [x] **Firma en Cliente (Non-Custodial)**: Las claves privadas nunca salen de la billetera del usuario.
- [x] **Tokens JWT con Expiración**: El JWT emitido expira en 24-72 horas y se valida mediante middleware en Go.

---

## 6. 🚀 Ejecución y Pruebas

1. **Prueba Unitaria Backend**:
   - Generar un par de claves local con `go-ethereum/crypto`.
   - Crear un mensaje SIWE, firmarlo y verificar que `HandleSIWE` devuelva status `200 OK` con un JWT válido y el usuario insertado en DB.
2. **Prueba de Integración Frontend**:
   - Abrir el navegador con la extensión de MetaMask instalada.
   - Navegar a `/auth/connect` y hacer clic en **MetaMask**.
   - Aceptar la conexión y firmar el mensaje emergente de MetaMask.
   - Comprobar que el usuario es redirigido al Dashboard con su dirección real y sesión activa.
