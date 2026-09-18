import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Zap, ArrowRight, 
  Link2, CreditCard, FileCheck, Clock,
  CheckCircle, Briefcase, Users
} from 'lucide-react';
import { api } from '../lib/api';
import { categories } from '../config/config';
import { AnimatedCounter } from '../components/ui/AnimatedComponents';

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  provider_name?: string;
  price_usd: number;
  coverage_amount: number;
  duration_days?: number;
  active_members?: number;
}

const features = [
  {
    icon: Link2,
    title: 'Garantías en Blockchain',
    description: 'Cada contrato de garantía queda registrado en la red Polygon de forma inmutable y transparente.',
  },
  {
    icon: CreditCard,
    title: 'Suscripciones Automatizadas',
    description: 'Membresías periódicas seguras. Sin cobros sorpresa y con cancelación en un solo clic.',
  },
  {
    icon: Shield,
    title: 'Sin Intermediarios Abusivos',
    description: 'Los fondos y coberturas se gestionan mediante contratos inteligentes de Unlock Protocol.',
  },
  {
    icon: FileCheck,
    title: 'Sistema Directo de Reclamos',
    description: 'Radica reclamos de garantía con evidencias y recibe resoluciones justas y verificables.',
  },
  {
    icon: Clock,
    title: 'Cobertura Inmediata',
    description: 'Tu garantía entra en vigencia de inmediato al firmar con tu billetera Web3.',
  },
  {
    icon: Zap,
    title: 'Para Médicos, Mecánicos y Más',
    description: 'Plataforma abierta para doctores, clínicas, talleres mecánicos, plomeros y consultores.',
  },
];

export default function Landing() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    api.getServices(1, 12)
      .then(res => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        setServices(list);
      })
      .catch(err => {
        console.error('Error loading services in landing:', err);
      })
      .finally(() => {
        setLoadingServices(false);
      });
  }, []);

  const filteredServices = activeCategory === 'all'
    ? services
    : services.filter(s => s.category === activeCategory);

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Zap size={14} /> Respaldado en Polygon Blockchain
            </div>
            <h1 className="hero-title">
              Garantías de servicios en las que <span className="highlight">sí puedes confiar</span>
            </h1>
            <p className="hero-subtitle">
              Suscríbete a servicios de mecánicos, médicos, dentistas y más con garantías auditables en blockchain. 
              Sin cláusulas ocultas ni promesas rotas: compromisos transparentes ejecutados por código.
            </p>
            <div className="hero-buttons">
              <a href="#services-catalog" className="btn-primary">
                Ver Todos los Servicios <ArrowRight size={18} />
              </a>
              <Link to="/wallet-connect" className="btn-secondary">
                Conectar Billetera (MetaMask)
              </Link>
            </div>
          </div>

          <div className="hero-illustration">
            <div className="hero-image-placeholder">
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                padding: 32,
              }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  background: 'rgba(105, 54, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Shield size={38} color="var(--primary)" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>
                    Garantía Blockchain Activa
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    AutoCare Pro & MediCare Plus
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    padding: '6px 14px',
                    background: 'rgba(0, 214, 114, 0.1)',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#00b35e',
                  }}>
                    ✓ Cobertura Verificada
                  </div>
                  <div style={{
                    padding: '6px 14px',
                    background: 'rgba(105, 54, 255, 0.1)',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--primary)',
                  }}>
                    Polygon (137)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 2 Roles (Cliente vs Proveedor) */}
      <section style={{ padding: '60px 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Dos Modos de Uso</span>
            <h2 className="section-title">Diseñado para Clientes y Prestadores de Servicios</h2>
            <p className="section-subtitle">
              Elige tu perfil al conectar tu billetera y accede a tu panel especializado.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 32 }}>
            {/* Card Rol Cliente */}
            <div style={{ background: 'var(--bg-primary)', padding: 32, borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Shield size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>Para Clientes / Pacientes</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                Contrata servicios garantizados para tu vehículo, salud o negocio. Administra tus pagos mensuales, visualiza tus coberturas y radica reclamos si el servicio no cumple lo prometido.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#00b35e" /> Cobertura garantizada en USD
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#00b35e" /> Radicación de reclamos con evidencias
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#00b35e" /> Cancelación libre en cualquier momento
                </li>
              </ul>
              <Link to="/services" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', borderColor: '#2563eb', color: '#2563eb' }}>
                Explorar Garantías Disponibles
              </Link>
            </div>

            {/* Card Rol Proveedor */}
            <div style={{ background: 'var(--bg-primary)', padding: 32, borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Briefcase size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>Para Proveedores / Vendedores</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                Eres médico, mecánico, dentista o profesional. Ofrece planes de garantía recurrentes a tus clientes para fidelizarlos, asegurar ingresos mensuales y gestionar reclamos con total transparencia.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#16a34a" /> Publicación de planes de servicio ilimitados
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#16a34a" /> Control de pacientes y clientes suscritos
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#16a34a" /> Panel de aprobación y revisión de reclamos
                </li>
              </ul>
              <Link to="/wallet-connect" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', borderColor: '#16a34a', color: '#16a34a' }}>
                Acceder como Proveedor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de Servicios en la Landing */}
      <section className="services-section" id="services-catalog">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Catálogo Oficial</span>
            <h2 className="section-title">Servicios y Garantías Disponibles</h2>
            <p className="section-subtitle">
              Explora y contrata garantías respaldadas en Polygon ofrecidas por profesionales verificados.
            </p>
          </div>

          {/* Filtros por Categoría */}
          <div className="services-header" style={{ marginBottom: 32 }}>
            <div className="filter-tabs">
              <button
                className={`filter-tab ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                Todos los Servicios ({services.length})
              </button>
              {Object.entries(categories).map(([key, category]) => (
                <button
                  key={key}
                  className={`filter-tab ${activeCategory === key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(key)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {loadingServices ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
              Cargando catálogo desde el backend...
            </div>
          ) : filteredServices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              No hay servicios registrados en esta categoría aún.
            </div>
          ) : (
            <div className="services-grid">
              {filteredServices.map((service) => {
                const catData = categories[service.category] || categories.doctor;
                return (
                  <div key={service.id} className="service-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div 
                        className="service-category-badge"
                        style={{
                          background: catData?.bgColor || 'rgba(0,0,0,0.05)',
                          color: catData?.color || 'inherit',
                        }}
                      >
                        {catData && <catData.icon size={14} />}
                        {catData?.name || service.category}
                      </div>

                      <h3 className="service-title">{service.title}</h3>
                      <p className="service-description" style={{ WebkitLineClamp: 3 }}>
                        {service.description}
                      </p>
                    </div>

                    <div>
                      <div className="service-pricing" style={{ margin: '16px 0' }}>
                        <div>
                          <div className="price-label">Suscripción Mensual</div>
                          <div className="price-value">${service.price_usd} USD</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="coverage-label">Garantía Máxima</div>
                          <div className="coverage-value" style={{ color: '#00b35e' }}>
                            ${service.coverage_amount?.toLocaleString()} USD
                          </div>
                        </div>
                      </div>

                      <div className="service-meta" style={{ marginBottom: 16 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Shield size={14} color="#00b35e" /> Smart Contract
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={14} /> {service.provider_name || 'Proveedor Verificado'}
                        </span>
                      </div>

                      <Link 
                        to={`/services/${service.id}`} 
                        className="btn-primary" 
                        style={{ width: '100%', justifyContent: 'center', padding: '10px 0' }}
                      >
                        Ver Detalles y Contratar <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/services" className="btn-secondary">
              Ver Catálogo Completo y Filtros Avanzados →
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section" id="features">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Beneficios</span>
            <h2 className="section-title">Por qué NoPayForNothing es diferente</h2>
            <p className="section-subtitle">
              Un estándar abierto que protege a los clientes y respalda a los mejores profesionales.
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card">
                <div className="feature-icon">
                  <feature.icon size={24} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-grid">
            <AnimatedCounter value={5000} suffix="+" label="Garantías Aseguradas" />
            <AnimatedCounter value={99} suffix="%" label="Resolución de Reclamos" />
            <AnimatedCounter value={350} prefix="$" suffix="K+" label="Monto Protegido" />
            <AnimatedCounter value={180} suffix="+" label="Proveedores Activos" />
          </div>
        </div>
      </section>
    </main>
  );
}
