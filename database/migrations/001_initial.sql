-- SecureMarket Database Migration
-- Run this to initialize the database schema

-- Users table (both providers and customers)
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS providers (
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
CREATE TABLE IF NOT EXISTS services (
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

-- Contracts (signed agreements between provider and customer)
CREATE TABLE IF NOT EXISTS contracts (
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
CREATE TABLE IF NOT EXISTS claims (
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
CREATE TABLE IF NOT EXISTS subscriptions (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_providers_user ON providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(category);
CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_provider ON contracts(provider_id);
CREATE INDEX IF NOT EXISTS idx_contracts_service ON contracts(service_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_lock ON contracts(lock_address);
CREATE INDEX IF NOT EXISTS idx_claims_contract ON claims(contract_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_contract ON subscriptions(contract_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- Seed Initial Providers and Services
INSERT INTO users (id, wallet_address, role, name, email)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '0x71cbf39b81b2259160d5b62b16d108d328400001', 'provider', 'AutoCare Pro Garage', 'autocare@example.com'),
  ('22222222-2222-2222-2222-222222222222', '0x71cbf39b81b2259160d5b62b16d108d328400002', 'provider', 'Dra. Elena Silva (MediCare Plus)', 'drasilva@medicare.com'),
  ('33333333-3333-3333-3333-333333333333', '0x71cbf39b81b2259160d5b62b16d108d328400003', 'provider', 'Dr. Mateo Vargas (Dental Care)', 'drmateo@dentalsmile.com'),
  ('44444444-4444-4444-4444-444444444444', '0x71cbf39b81b2259160d5b62b16d108d328400004', 'provider', 'CleanPro Hogar & Oficina', 'contacto@cleanpro.com'),
  ('55555555-5555-5555-5555-555555555555', '0x71cbf39b81b2259160d5b62b16d108d328400005', 'provider', 'HomeShield Plomería 24/7', 'soporte@homeshield.com'),
  ('66666666-6666-6666-6666-666666666666', '0x71cbf39b81b2259160d5b62b16d108d328400006', 'provider', 'LegalShield Asesoría Jurídica', 'info@legalshield.com')
ON CONFLICT (wallet_address) DO NOTHING;

INSERT INTO providers (id, user_id, business_name, category, description, rating, total_contracts, verified)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'AutoCare Pro', 'mechanic', 'Taller mecánico especializado en mantenimiento preventivo, frenos y transmisión con repuestos OEM garantizados.', 4.95, 128, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'MediCare Plus', 'doctor', 'Clínica médica y consultas especializadas. Cobertura de tratamientos crónicos y emergencias ambulatorias.', 4.98, 214, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'DentalSmile Clinic', 'doctor', 'Atención odontológica integral, limpiezas profundas, ortodoncia y emergencias dentales aseguradas.', 4.90, 95, true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'CleanPro Express', 'cleaner', 'Servicios de limpieza residencial y comercial profunda con garantía de satisfacción o repetición gratuita.', 4.88, 76, true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'HomeShield Plomería', 'plumber', 'Plomeros certificados disponibles 24/7 para filtraciones, tuberías y reparaciones con garantía de 90 días.', 4.92, 110, true),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '66666666-6666-6666-6666-666666666666', 'LegalShield Abogados', 'legal', 'Bufete de abogados para protección contractual, defensa al consumidor y asesorías comerciales.', 4.85, 42, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, provider_id, network_id, title, description, category, price_usd, coverage_amount, coverage_details, duration_days, max_members, active_members, status)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 137, 'Mantenimiento Mecánico Integral', 'Garantía mensual completa para tu vehículo. Incluye cambio de aceite sintético, revisión computarizada de motor, frenos y alineación con cobertura de reparación hasta $2,500 USD.', 'mechanic', 29.00, 2500.00, '{"items":["Cambio de aceite sintético y filtros OEM","Diagnóstico computarizado por escáner","Revisión y rectificación de frenos","Garantía de mano de obra 90 días","Re-inspección sin costo"]}', 30, 200, 48, 'active'),
  ('11111111-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 137, 'Plan de Salud Familiar & Telemedicina', 'Acceso ilimitado a consultas con médicos especialistas, seguimiento de condiciones crónicas (diabetes, hipertensión) y recetas digitales con cobertura de hasta $3,000 USD.', 'doctor', 49.00, 3000.00, '{"items":["Consultas médicas virtuales ilimitadas 24/7","Atención prioritaria con especialistas","Seguimiento personalizado de tratamiento","Recetas médicas electrónicas certificadas"]}', 30, 350, 112, 'active'),
  ('11111111-0000-0000-0000-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 137, 'Garantía Odontológica Integral', 'Plan de cuidado dental que incluye revisiones periódicas, limpiezas con ultrasonido, radiografías y cobertura ante urgencias de hasta $1,800 USD.', 'doctor', 39.00, 1800.00, '{"items":["Limpiezas semestrales con profilaxis","Tratamiento de caries y sellantes","Atención de urgencia dental 24h","Descuento del 40% en ortodoncia"]}', 30, 150, 64, 'active'),
  ('11111111-0000-0000-0000-000000000004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 137, 'Limpieza y Desinfección Premium', 'Servicio de limpieza profunda para casas o departamentos con productos ecológicos y garantía de re-limpieza en menos de 24 horas si no estás 100% satisfecho.', 'cleaner', 35.00, 800.00, '{"items":["Limpieza de todas las áreas habitables","Desinfección de baños y cocinas","Limpieza interna de electrodomésticos","Garantía de repetición gratis en 24h"]}', 30, 100, 31, 'active'),
  ('11111111-0000-0000-0000-000000000005', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 137, 'Protección de Plomería e Instalaciones', 'Garantía 24/7 para filtraciones, tuberías rotas, problemas de drenaje y presión de agua con cobertura de repuestos y mano de obra hasta $1,500 USD.', 'plumber', 25.00, 1500.00, '{"items":["Respuesta de emergencia en menos de 60 min","Reparación de filtraciones y fugas","Desobstrucción de cañerías principales","Garantía de repuestos de 6 meses"]}', 30, 120, 42, 'active'),
  ('11111111-0000-0000-0000-000000000006', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 137, 'Asesoría y Blindaje Legal Continuo', 'Respaldo jurídico para contratos de arrendamiento, reclamos comerciales, revisión de acuerdos y mediación con cobertura legal de hasta $4,000 USD.', 'legal', 65.00, 4000.00, '{"items":["Revisión ilimitada de contratos y acuerdos","Redacción de cartas notariales e intimaciones","Asesoría jurídica corporativa y personal","Representación en mediaciones extrajudiciales"]}', 30, 80, 19, 'active')
ON CONFLICT (id) DO NOTHING;

