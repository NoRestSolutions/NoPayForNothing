import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, ArrowRight, Search } from 'lucide-react';
import { api } from '../lib/api';
import { categories } from '../config/config';

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

export default function Services() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const cat = activeCategory === 'all' ? undefined : activeCategory;
    api.getServices(1, 50, cat)
      .then(res => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        setServices(list);
      })
      .catch(err => {
        console.error('Error fetching services:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeCategory]);

  const filteredServices = services.filter(service => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      service.title.toLowerCase().includes(q) ||
      service.description.toLowerCase().includes(q) ||
      (service.provider_name && service.provider_name.toLowerCase().includes(q))
    );
  });

  return (
    <main>
      <section className="services-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Catálogo Completo</span>
            <h1 className="section-title">Servicios con Garantías Respaldadas</h1>
            <p className="section-subtitle">
              Encuentra planes de salud, talleres mecánicos, clínicas dentales y servicios profesionales asegurados en Polygon.
            </p>
          </div>

          {/* Barra de búsqueda y Filtros */}
          <div className="services-header" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ position: 'relative', maxWidth: 480, width: '100%', margin: '0 auto' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                placeholder="Buscar por servicio, doctor, taller o especialidad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                }}
              />
            </div>

            <div className="filter-tabs">
              <button
                className={`filter-tab ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                Todos los Servicios
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
              <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
              Cargando servicios disponibles...
            </div>
          ) : filteredServices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.125rem', marginBottom: 8 }}>No se encontraron servicios que coincidan con la búsqueda.</p>
              <button onClick={() => { setActiveCategory('all'); setSearchQuery(''); }} className="btn-secondary">
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="services-grid">
              {filteredServices.map((service) => {
                const catData = categories[service.category] || categories.doctor;
                return (
                  <Link 
                    key={service.id} 
                    to={`/services/${service.id}`}
                    className="service-card"
                    style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
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
                          <div className="price-label">Mensualidad</div>
                          <div className="price-value">${service.price_usd} USD</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="coverage-label">Cobertura Máx</div>
                          <div className="coverage-value" style={{ color: '#00b35e' }}>
                            ${service.coverage_amount?.toLocaleString()} USD
                          </div>
                        </div>
                      </div>

                      <div className="service-meta" style={{ marginBottom: 16 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Shield size={14} color="#00b35e" /> Garantizado
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={14} /> {service.provider_name || 'Proveedor Verificado'}
                        </span>
                      </div>

                      <div className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 0' }}>
                        Ver Garantía y Contratar <ArrowRight size={16} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
