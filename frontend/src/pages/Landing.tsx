import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export default function Landing() {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  const features = [
    {
      icon: Link2,
      title: t('landing.feature1Title'),
      description: t('landing.feature1Desc'),
    },
    {
      icon: CreditCard,
      title: t('landing.feature2Title'),
      description: t('landing.feature2Desc'),
    },
    {
      icon: Shield,
      title: t('landing.feature3Title'),
      description: t('landing.feature3Desc'),
    },
    {
      icon: FileCheck,
      title: t('landing.feature4Title'),
      description: t('landing.feature4Desc'),
    },
    {
      icon: Clock,
      title: t('landing.feature5Title'),
      description: t('landing.feature5Desc'),
    },
    {
      icon: Zap,
      title: t('landing.feature6Title'),
      description: t('landing.feature6Desc'),
    },
  ];

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
              <Zap size={14} /> {t('landing.badge')}
            </div>
            <h1 className="hero-title">
              {t('landing.heroTitle1')} <span className="highlight">{t('landing.heroHighlight')}</span>
            </h1>
            <p className="hero-subtitle">
              {t('landing.heroSubtitle')}
            </p>
            <div className="hero-buttons">
              <a href="#services-catalog" className="btn-primary">
                {t('landing.verServicios')} <ArrowRight size={18} />
              </a>
              <Link to="/wallet-connect" className="btn-secondary">
                {t('landing.conectarBilletera')}
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
                    {t('landing.garantiaActiva')}
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
                    ✓ {t('landing.coberturaVerificada')}
                  </div>
                  <div style={{
                    padding: '6px 14px',
                    background: 'rgba(105, 54, 255, 0.1)',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--primary)',
                  }}>
                    Sepolia (11155111)
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
            <span className="section-badge">{t('landing.dosModos')}</span>
            <h2 className="section-title">{t('landing.disenadoPara')}</h2>
            <p className="section-subtitle">
              {t('landing.eligePerfil')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 32 }}>
            {/* Card Rol Cliente */}
            <div style={{ background: 'var(--bg-primary)', padding: 32, borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Shield size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>{t('landing.paraClientes')}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                {t('landing.clientesDesc')}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#00b35e" /> {t('landing.coberturaUSD')}
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#00b35e" /> {t('landing.radicacionReclamos')}
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#00b35e" /> {t('landing.cancelacionLibre')}
                </li>
              </ul>
              <Link to="/services" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', borderColor: '#2563eb', color: '#2563eb' }}>
                {t('landing.explorarGarantias')}
              </Link>
            </div>

            {/* Card Rol Proveedor */}
            <div style={{ background: 'var(--bg-primary)', padding: 32, borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Briefcase size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>{t('landing.paraProveedores')}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                {t('landing.proveedoresDesc')}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#16a34a" /> {t('landing.publicacionPlanes')}
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#16a34a" /> {t('landing.controlPacientes')}
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#16a34a" /> {t('landing.panelReclamos')}
                </li>
              </ul>
              <Link to="/wallet-connect" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', borderColor: '#16a34a', color: '#16a34a' }}>
                {t('landing.accederProveedor')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de Servicios en la Landing */}
      <section className="services-section" id="services-catalog">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">{t('landing.catalogoOficial')}</span>
            <h2 className="section-title">{t('landing.serviciosDisponibles')}</h2>
            <p className="section-subtitle">
              {t('landing.explorarGarantiasDesc')}
            </p>
          </div>

          {/* Filtros por Categoría */}
          <div className="services-header" style={{ marginBottom: 32 }}>
            <div className="filter-tabs">
              <button
                className={`filter-tab ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                {t('landing.todosLosServicios')} ({services.length})
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
              {t('services.cargando')}
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
                          <div className="price-label">{t('landing.suscripcionMensual')}</div>
                          <div className="price-value">${service.price_usd} ETH</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="coverage-label">{t('landing.garantiaMaxima')}</div>
                          <div className="coverage-value" style={{ color: '#00b35e' }}>
                            ${service.coverage_amount?.toLocaleString()} USD
                          </div>
                        </div>
                      </div>

                      <div className="service-meta" style={{ marginBottom: 16 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Shield size={14} color="#00b35e" /> {t('landing.smartContract')}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={14} /> {service.provider_name || t('landing.proveedorVerificado')}
                        </span>
                      </div>

                      <Link 
                        to={`/services/${service.id}`} 
                        className="btn-primary" 
                        style={{ width: '100%', justifyContent: 'center', padding: '10px 0' }}
                      >
                        {t('landing.verDetalles')} <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/services" className="btn-secondary">
              {t('landing.verCatalogoCompleto')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section" id="features">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">{t('landing.beneficios')}</span>
            <h2 className="section-title">{t('landing.porQueDiferente')}</h2>
            <p className="section-subtitle">
              {t('landing.estandarAbierto')}
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
            <AnimatedCounter value={5000} suffix="+" label={t('landing.garantiasAseguradas')} />
            <AnimatedCounter value={99} suffix="%" label={t('landing.resolucionReclamos')} />
            <AnimatedCounter value={350} prefix="$" suffix="K+" label={t('landing.montoProtegido')} />
            <AnimatedCounter value={180} suffix="+" label={t('landing.proveedoresActivos')} />
          </div>
        </div>
      </section>
    </main>
  );
}
