import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Shield, CheckCircle, 
  Lock, ArrowLeft, Users, ExternalLink, AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { categories } from '../config/config';

interface ServiceDetailData {
  id: string;
  provider_id: string;
  provider_name?: string;
  title: string;
  description: string;
  category: string;
  price_usd: number;
  coverage_amount: number;
  coverage_details?: {
    items?: string[];
  };
  duration_days?: number;
  max_members?: number;
  active_members?: number;
  status: string;
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, signIn } = useAuth();
  
  const [service, setService] = useState<ServiceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getService(id)
      .then(data => {
        setService(data);
      })
      .catch(err => {
        console.error('Error fetching service:', err);
        setError('No se pudo cargar la información del servicio.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleSubscribe = async () => {
    if (!service) return;
    setError(null);

    // Si no está autenticado, solicitar conexión primero
    if (!isAuthenticated) {
      try {
        await signIn('customer');
      } catch (err: any) {
        setError(err.message || 'Por favor conecta tu billetera para contratar.');
        return;
      }
    }

    setSubscribing(true);
    try {
      await api.createContract(service.id);
      setSubscribed(true);
    } catch (err: any) {
      console.error('Error subscribing:', err);
      setError(err.message || 'Error al procesar el contrato de garantía.');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Cargando detalles de la garantía...</p>
        </div>
      </main>
    );
  }

  if (error && !service) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <AlertCircle size={40} color="#f54242" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Servicio no encontrado</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{error}</p>
          <Link to="/services" className="btn-primary" style={{ justifyContent: 'center' }}>
            Volver al Catálogo
          </Link>
        </div>
      </main>
    );
  }

  if (subscribed && service) {
    return (
      <main>
        <div style={{ 
          minHeight: '80vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 24,
          background: 'var(--bg-secondary)',
        }}>
          <div className="auth-card" style={{ maxWidth: 520, textAlign: 'center' }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: 'rgba(0, 214, 114, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <CheckCircle size={36} color="#00b35e" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>
              ¡Garantía Activada con Éxito!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              Tu suscripción y contrato de garantía para <strong>{service.title}</strong> con <strong>{service.provider_name || 'el proveedor'}</strong> ya está registrado en Polygon.
            </p>
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <Link to="/dashboard/customer" className="btn-primary">
                Ver en Mi Dashboard de Cliente
              </Link>
              <Link to="/services" className="btn-secondary">
                Explorar Más Servicios
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!service) return null;

  const categoryData = categories[service.category] || categories.doctor;
  const coverageItems = service.coverage_details?.items || [
    'Atención y ejecución profesional garantizada',
    'Revisión y solución prioritaria ante inconvenientes',
    'Cobertura económica hasta el límite establecido en caso de incumplimiento',
    'Contrato auditable firmado en Polygon',
  ];

  return (
    <main>
      <section className="services-section">
        <div className="section-container">
          <Link 
            to="/services" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              marginBottom: 32,
              fontSize: '0.9375rem',
            }}
          >
            <ArrowLeft size={18} /> Volver al Catálogo
          </Link>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 48,
            alignItems: 'start',
          }}>
            {/* Contenido Principal */}
            <div>
              <div 
                className="service-category-badge"
                style={{
                  background: categoryData?.bgColor || 'var(--bg-secondary)',
                  color: categoryData?.color || 'var(--text-primary)',
                  marginBottom: 16,
                }}
              >
                {categoryData && <categoryData.icon size={14} />}
                {categoryData?.name || service.category}
              </div>

              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: 800, 
                marginBottom: 16,
                color: 'var(--text-primary)',
              }}>
                {service.title}
              </h1>

              <p style={{ 
                color: 'var(--text-secondary)', 
                lineHeight: 1.7,
                marginBottom: 32,
                fontSize: '1.0625rem',
              }}>
                {service.description}
              </p>

              <div style={{ marginBottom: 32 }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 700, 
                  marginBottom: 16,
                  color: 'var(--text-primary)',
                }}>
                  Lo que incluye esta Garantía
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {coverageItems.map((item: string, i: number) => (
                    <li key={i} style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 0',
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9375rem',
                    }}>
                      <CheckCircle size={18} color="#00b35e" style={{ flexShrink: 0, marginTop: 2 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 700, 
                  marginBottom: 16,
                  color: 'var(--text-primary)',
                }}>
                  Compromisos del Proveedor
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                }}>
                  <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: '0.875rem' }}>
                    <Shield size={16} color="var(--primary)" style={{ display: 'inline', marginRight: 6 }} />
                    Protección hasta ${service.coverage_amount} USD
                  </div>
                  <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: '0.875rem' }}>
                    <CheckCircle size={16} color="#00b35e" style={{ display: 'inline', marginRight: 6 }} />
                    Sin letras pequeñas
                  </div>
                  <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: '0.875rem' }}>
                    <Users size={16} color="var(--primary)" style={{ display: 'inline', marginRight: 6 }} />
                    Atención directa del prestador
                  </div>
                  <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: '0.875rem' }}>
                    <ExternalLink size={16} color="#2563eb" style={{ display: 'inline', marginRight: 6 }} />
                    Respaldado en Polygon
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta Lateral de Suscripción */}
            <div style={{
              position: 'sticky',
              top: 96,
              padding: 28,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 16,
            }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Precio Mensual
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ${service.price_usd} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>USD / mes</span>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Monto de Cobertura Garantizada
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#00b35e' }}>
                  Hasta ${service.coverage_amount?.toLocaleString()} USD
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Prestador del Servicio
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}>
                  <Users size={18} color="var(--primary)" />
                  {service.provider_name || 'Proveedor Verificado'}
                </div>
              </div>

              {error && (
                <div style={{ padding: 12, background: 'rgba(245, 66, 66, 0.1)', color: '#f54242', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <button 
                className="btn-primary" 
                style={{ width: '100%', marginBottom: 16, padding: '14px 0', fontSize: '1rem', justifyContent: 'center' }}
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? (
                  <>
                    <div className="animate-spin" style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    Confirmando Contrato en Polygon...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Contratar Garantía Ahora
                  </>
                )}
              </button>

              <p style={{ 
                fontSize: '0.8125rem', 
                color: 'var(--text-muted)', 
                textAlign: 'center',
                lineHeight: 1.5,
              }}>
                Contrato firmado mediante EIP-4361 en Polygon. Puedes cancelar o radicar reclamos cuando lo desees desde tu panel.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
