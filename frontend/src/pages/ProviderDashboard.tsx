import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, TrendingUp, AlertTriangle, 
  CheckCircle, Plus, Briefcase, 
  Wallet, Shield, X, RefreshCw,
  ExternalLink, Clock
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { categories } from '../config/config';

interface PatientContract {
  id: string;
  service_id: string;
  customer_id: string;
  service_title?: string;
  customer_address?: string;
  price_usd?: number;
  coverage_amount?: number;
  status: string;
  signed_at?: string;
  expires_at?: string;
}

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price_usd: number;
  coverage_amount: number;
  active_members: number;
  status: string;
  created_at: string;
}

interface ClaimItem {
  id: string;
  contract_id: string;
  service_title?: string;
  customer_address?: string;
  amount: number;
  description: string;
  status: string;
  evidence_urls?: string[];
  created_at: string;
}

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { walletAddress, updateRole } = useAuth();
  const [patients, setPatients] = useState<PatientContract[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'patients' | 'services' | 'claims'>('patients');

  // Modal para Crear Servicio
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('doctor');
  const [price, setPrice] = useState('');
  const [coverage, setCoverage] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Estados de aprobación/rechazo de reclamos
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patientsRes, servicesRes, claimsRes] = await Promise.all([
        api.getContracts('provider').catch(() => []),
        api.getServices(1, 50).catch(() => ({ data: [] })),
        api.getClaims('provider').catch(() => []),
      ]);

      setPatients(Array.isArray(patientsRes) ? patientsRes : []);
      const servicesList = servicesRes?.data || (Array.isArray(servicesRes) ? servicesRes : []);
      setServices(servicesList);
      setClaims(Array.isArray(claimsRes) ? claimsRes : []);
    } catch (err) {
      console.error('Error fetching provider dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchData();
    }
  }, [walletAddress]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(price);
    const coverageNum = parseFloat(coverage);

    if (!title.trim() || isNaN(priceNum) || isNaN(coverageNum) || !description.trim()) {
      setCreateError('Por favor completa todos los campos requeridos.');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      await api.createService({
        title: title.trim(),
        category,
        price_usd: priceNum,
        coverage_amount: coverageNum,
        description: description.trim(),
        duration_days: durationDays,
        coverage_details: {
          items: [
            'Atención profesional certificada',
            'Garantía respaldada en smart contract',
            'Soporte directo para reclamos',
          ],
        },
      });

      setShowCreateModal(false);
      setTitle('');
      setPrice('');
      setCoverage('');
      setDescription('');
      fetchData();
      setActiveTab('services');
    } catch (err: any) {
      setCreateError(err.message || 'Error al publicar el servicio.');
    } finally {
      setCreating(false);
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    if (!window.confirm('¿Deseas aprobar este reclamo y liberar el pago de garantía?')) return;
    setActionLoadingId(claimId);
    try {
      await api.approveClaim(claimId);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al aprobar reclamo');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    if (!window.confirm('¿Deseas rechazar este reclamo?')) return;
    setActionLoadingId(claimId);
    try {
      await api.rejectClaim(claimId);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al rechazar reclamo');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!walletAddress) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo"><Wallet size={28} color="white" /></div>
          <h2 className="auth-title">Conecta tu Billetera</h2>
          <p className="auth-subtitle">Inicia sesión para administrar tus pacientes, servicios y garantías.</p>
          <Link to="/wallet-connect" className="btn-primary" style={{ justifyContent: 'center' }}>
            Conectar Billetera
          </Link>
        </div>
      </main>
    );
  }

  // Cálculos de métricas
  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.status === 'active').length;
  const monthlyRevenue = patients
    .filter(p => p.status === 'active')
    .reduce((acc, p) => acc + (p.price_usd || 0), 0);
  const pendingClaims = claims.filter(c => c.status === 'pending');

  return (
    <main>
      {/* Header del Dashboard de Proveedor */}
      <div className="dashboard-header" style={{ background: 'linear-gradient(180deg, rgba(16, 163, 74, 0.08) 0%, transparent 100%)' }}>
        <div className="section-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(16, 163, 74, 0.1)', color: '#16a34a', borderRadius: 20, fontSize: '0.8125rem', fontWeight: 600, marginBottom: 8 }}>
                <Briefcase size={14} /> Panel del Proveedor / Prestador
              </div>
              <h1 className="dashboard-title">Administración de Servicios & Pacientes</h1>
              <p className="dashboard-subtitle">
                Gestiona tus suscriptores, publica planes de garantía y revisa reclamos en Polygon.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={fetchData} 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px' }}
                title="Actualizar datos"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Actualizar
              </button>

              <button 
                onClick={() => {
                  updateRole('customer');
                  navigate('/dashboard/customer');
                }}
                className="btn-secondary"
                style={{ borderColor: '#2563eb', color: '#2563eb' }}
              >
                Cambiar a Modo Cliente 🛡️
              </button>

              <button 
                onClick={() => setShowCreateModal(true)} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a' }}
              >
                <Plus size={16} /> Crear Nuevo Plan / Servicio
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Estadísticas de Negocio */}
        <div className="stats-row">
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Pacientes / Clientes Activos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activePatients} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>({totalPatients} total)</span></div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Ingresos Mensuales Proyectados</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${monthlyRevenue.toFixed(2)} USD</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Reclamos por Revisar</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: pendingClaims.length > 0 ? '#ea580c' : 'inherit' }}>
                {pendingClaims.length}
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(105, 54, 255, 0.1)', color: 'var(--primary)' }}>
              <Shield size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Servicios Publicados</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{services.length}</div>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            Pacientes / Clientes Suscritos ({patients.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            Mis Servicios Publicados ({services.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
            onClick={() => setActiveTab('claims')}
          >
            Reclamos Recibidos ({claims.length})
          </button>
        </div>

        {/* TAB 1: Pacientes y Clientes */}
        {activeTab === 'patients' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
                Cargando suscriptores desde la red Polygon...
              </div>
            ) : patients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px dashed var(--border)' }}>
                <Users size={48} color="#16a34a" style={{ opacity: 0.6, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Aún no tienes pacientes suscritos</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 24px' }}>
                  Cuando los clientes contraten tus planes de garantía en la plataforma, aparecerán aquí para que puedas gestionar su atención.
                </p>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ background: '#16a34a' }}>
                  Publicar Nuevo Servicio
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {patients.map((patient) => (
                  <div key={patient.id} className="contract-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Billetera del Paciente / Cliente</div>
                        <h3 style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                          {patient.customer_address ? `${patient.customer_address.slice(0, 12)}...${patient.customer_address.slice(-8)}` : 'Paciente'}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>
                          Plan: {patient.service_title || 'Garantía'}
                        </p>
                      </div>

                      <span className={`status-badge status-${patient.status}`}>
                        {patient.status === 'active' && <CheckCircle size={14} />}
                        {patient.status === 'claimed' && <Clock size={14} />}
                        {patient.status === 'active' ? 'Suscripción Activa' : patient.status === 'claimed' ? 'Reclamo en Curso' : patient.status}
                      </span>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                      gap: 16,
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: '1px solid var(--border)',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Abono Mensual</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#16a34a' }}>
                          ${patient.price_usd || 0} USD
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto Cobertura</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                          ${patient.coverage_amount?.toLocaleString() || 0} USD
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fecha Suscripción</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {patient.signed_at ? new Date(patient.signed_at).toLocaleDateString() : 'Activo'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Polygon Contract</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          EIP-4361 / Unlock
                          <ExternalLink size={12} color="var(--text-muted)" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Servicios Publicados */}
        {activeTab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Catálogo de Planes y Garantías</h2>
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="btn-primary" 
                style={{ background: '#16a34a', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
              >
                <Plus size={16} /> Crear Plan
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {services.map((service) => {
                const catData = categories[service.category] || categories.doctor;
                return (
                  <div key={service.id} className="service-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div 
                        className="service-category-badge"
                        style={{ background: catData?.bgColor || 'rgba(0,0,0,0.05)', color: catData?.color || 'inherit' }}
                      >
                        {catData && <catData.icon size={14} />}
                        {catData?.name || service.category}
                      </div>

                      <h3 className="service-title">{service.title}</h3>
                      <p className="service-description" style={{ WebkitLineClamp: 3 }}>{service.description}</p>
                    </div>

                    <div>
                      <div className="service-pricing" style={{ margin: '16px 0 12px' }}>
                        <div>
                          <div className="price-label">Precio Mensual</div>
                          <div className="price-value" style={{ color: '#16a34a' }}>${service.price_usd} USD</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="coverage-label">Garantía Máx</div>
                          <div className="coverage-value">${service.coverage_amount} USD</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        <span>👥 {service.active_members || 0} suscriptores activos</span>
                        <Link to={`/services/${service.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                          Ver Público →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Reclamos de Clientes */}
        {activeTab === 'claims' && (
          <div>
            {claims.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px dashed var(--border)' }}>
                <CheckCircle size={48} color="#16a34a" style={{ opacity: 0.6, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Sin reclamos pendientes</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto' }}>
                  No tienes reclamos radicados por tus clientes o pacientes en este momento.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {claims.map((claim) => (
                  <div key={claim.id} className="contract-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>
                          Reclamo: {claim.service_title || 'Servicio'}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          Cliente: {claim.customer_address || 'Dirección de Cliente'}
                        </p>
                      </div>

                      <span className={`status-badge status-${claim.status}`}>
                        {claim.status === 'approved' && <CheckCircle size={14} />}
                        {claim.status === 'pending' && <Clock size={14} />}
                        {claim.status === 'rejected' && <AlertTriangle size={14} />}
                        {claim.status === 'approved' ? 'Aprobado' : claim.status === 'pending' ? 'Pendiente de Revisión' : 'Rechazado'}
                      </span>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8, margin: '14px 0', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                      <strong>Descripción del Incidente:</strong> {claim.description}
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 16,
                      paddingTop: 14,
                      borderTop: '1px solid var(--border)',
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Monto Solicitado: </span>
                        <strong style={{ color: '#ea580c', fontSize: '1.125rem' }}>${claim.amount} USD</strong>
                      </div>

                      {claim.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            onClick={() => handleApproveClaim(claim.id)}
                            disabled={actionLoadingId === claim.id}
                            className="btn-primary"
                            style={{ background: '#16a34a', padding: '8px 16px', fontSize: '0.875rem' }}
                          >
                            ✓ Aprobar Reclamo
                          </button>
                          <button
                            onClick={() => handleRejectClaim(claim.id)}
                            disabled={actionLoadingId === claim.id}
                            className="btn-secondary"
                            style={{ color: '#f54242', padding: '8px 16px', fontSize: '0.875rem' }}
                          >
                            ✕ Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para Publicar Nuevo Servicio */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div className="auth-card" style={{ maxWidth: 560, width: '100%', position: 'relative', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setShowCreateModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={22} color="#16a34a" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Crear Nuevo Plan de Garantía</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                  Ofrece tus servicios profesionales con respaldo en la blockchain de Polygon.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateService}>
              {createError && (
                <div style={{ padding: 12, background: 'rgba(245, 66, 66, 0.1)', color: '#f54242', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>
                  <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6 }} />
                  {createError}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                  Título del Servicio o Plan
                </label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Plan Dental Premium, Mantenimiento de Frenos, Telemedicina 24/7"
                  required
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                  >
                    {Object.entries(categories).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                    Duración (Días)
                  </label>
                  <input 
                    type="number" 
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 30)}
                    placeholder="30"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                    Precio Mensual (USD)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ej: 39.00"
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                    Límite Cobertura Garantía (USD)
                  </label>
                  <input 
                    type="number" 
                    step="1"
                    min="10"
                    value={coverage}
                    onChange={(e) => setCoverage(e.target.value)}
                    placeholder="Ej: 2000"
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                  Descripción Detallada de la Garantía
                </label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe qué procedimientos, atenciones o repuestos cubre tu plan garantizado..."
                  required
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="btn-primary"
                  style={{ background: '#16a34a' }}
                >
                  {creating ? 'Publicando en Polygon...' : 'Publicar Servicio y Garantía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
