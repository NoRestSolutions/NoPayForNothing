import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, TrendingUp, AlertTriangle, 
  CheckCircle, Plus, Briefcase, 
  Wallet, Shield, X, RefreshCw,
  ExternalLink, Clock, Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setCreateError(t('providerDashboard.errorFieldsRequired'));
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
            t('providerDashboard.coverageItem1'),
            t('providerDashboard.coverageItem2'),
            t('providerDashboard.coverageItem3'),
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
      const msg = err.message || t('providerDashboard.errorPublishService');
      if (msg.includes('unauthorized')) {
        setCreateError(t('providerDashboard.errorSessionExpired'));
      } else {
        setCreateError(msg);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    if (!window.confirm(t('providerDashboard.confirmApproveClaim'))) return;
    setActionLoadingId(claimId);
    try {
      await api.approveClaim(claimId);
      await fetchData();
    } catch (err: any) {
      alert(err.message || t('providerDashboard.errorApproveClaim'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    if (!window.confirm(t('providerDashboard.confirmRejectClaim'))) return;
    setActionLoadingId(claimId);
    try {
      await api.rejectClaim(claimId);
      await fetchData();
    } catch (err: any) {
      alert(err.message || t('providerDashboard.errorRejectClaim'));
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!walletAddress || !api.getToken()) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo"><Wallet size={28} color="white" /></div>
          <h2 className="auth-title">{t('providerDashboard.conectaBilletera')}</h2>
          <p className="auth-subtitle">{t('providerDashboard.conectaBilleteraDesc')}</p>
          <Link to="/wallet-connect" className="btn-primary" style={{ justifyContent: 'center' }}>
            {t('providerDashboard.conectarBilletera')}
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
                <Briefcase size={14} /> {t('providerDashboard.panelProveedor')}
              </div>
              <h1 className="dashboard-title">{t('providerDashboard.adminServicios')}</h1>
              <p className="dashboard-subtitle">
                {t('providerDashboard.gestionaSuscriptores')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={fetchData} 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px' }}
                title={t('providerDashboard.actualizarDatos')}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {t('providerDashboard.actualizar')}
              </button>

              <button 
                onClick={() => {
                  updateRole('customer');
                  navigate('/dashboard/customer');
                }}
                className="btn-secondary"
                style={{ borderColor: '#2563eb', color: '#2563eb' }}
              >
                {t('providerDashboard.cambiarCliente')}
              </button>

              <button 
                onClick={() => navigate('/dashboard/locks')} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--primary)' }}
              >
                <Lock size={16} /> {t('providerDashboard.gestionarLocks')}
              </button>

              <button 
                onClick={() => setShowCreateModal(true)} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a' }}
              >
                <Plus size={16} /> {t('providerDashboard.crearNuevoPlan')}
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
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('providerDashboard.pacientesActivos')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activePatients} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>({totalPatients} total)</span></div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('providerDashboard.ingresosMensuales')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${monthlyRevenue.toFixed(2)} ETH</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('providerDashboard.reclamosRevisar')}</div>
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
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('providerDashboard.serviciosPublicados')}</div>
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
            {t('providerDashboard.pacientesSuscritos')} ({patients.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            {t('providerDashboard.misServicios')} ({services.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
            onClick={() => setActiveTab('claims')}
          >
            {t('providerDashboard.reclamosRecibidos')} ({claims.length})
          </button>
        </div>

        {/* TAB 1: Pacientes y Clientes */}
        {activeTab === 'patients' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
                {t('providerDashboard.loadingSubscribers')}
              </div>
            ) : patients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px dashed var(--border)' }}>
                <Users size={48} color="#16a34a" style={{ opacity: 0.6, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>{t('providerDashboard.noPatientsYet')}</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 24px' }}>
                  {t('providerDashboard.noPatientsDesc')}
                </p>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ background: '#16a34a' }}>
                  {t('providerDashboard.publicarNuevoServicio')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {patients.map((patient) => (
                  <div key={patient.id} className="contract-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>{t('providerDashboard.billeteraPaciente')}</div>
                        <h3 style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                          {patient.customer_address ? `${patient.customer_address.slice(0, 12)}...${patient.customer_address.slice(-8)}` : t('providerDashboard.paciente')}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>
                          {t('providerDashboard.plan')}: {patient.service_title || t('providerDashboard.garantia')}
                        </p>
                      </div>

                      <span className={`status-badge status-${patient.status}`}>
                        {patient.status === 'active' && <CheckCircle size={14} />}
                        {patient.status === 'claimed' && <Clock size={14} />}
                        {patient.status === 'active' ? t('providerDashboard.suscripcionActiva') : patient.status === 'claimed' ? t('providerDashboard.reclamoEnCurso') : patient.status}
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
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('providerDashboard.abonoMensual')}</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#16a34a' }}>
                          ${patient.price_usd || 0} ETH
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('providerDashboard.montoCobertura')}</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                          ${patient.coverage_amount?.toLocaleString() || 0} USD
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('providerDashboard.fechaSuscripcion')}</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {patient.signed_at ? new Date(patient.signed_at).toLocaleDateString() : t('providerDashboard.activo')}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('providerDashboard.redBlockchain')}</div>
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('providerDashboard.catalogoPlanes')}</h2>
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="btn-primary" 
                style={{ background: '#16a34a', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
              >
                <Plus size={16} /> {t('providerDashboard.crearPlan')}
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
                          <div className="price-label">{t('providerDashboard.precioMensual')}</div>
                          <div className="price-value" style={{ color: '#16a34a' }}>${service.price_usd} ETH</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="coverage-label">{t('providerDashboard.garantiaMax')}</div>
                          <div className="coverage-value">${service.coverage_amount} USD</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        <span>👥 {service.active_members || 0} {t('providerDashboard.suscriptoresActivos')}</span>
                        <Link to={`/services/${service.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                          {t('providerDashboard.verPublico')}
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>{t('providerDashboard.sinReclamos')}</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto' }}>
                  {t('providerDashboard.sinReclamosDesc')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {claims.map((claim) => (
                  <div key={claim.id} className="contract-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>
                          {t('providerDashboard.reclamo')}: {claim.service_title || t('providerDashboard.servicio')}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {t('providerDashboard.cliente')}: {claim.customer_address || t('providerDashboard.direccionCliente')}
                        </p>
                      </div>

                      <span className={`status-badge status-${claim.status}`}>
                        {claim.status === 'approved' && <CheckCircle size={14} />}
                        {claim.status === 'pending' && <Clock size={14} />}
                        {claim.status === 'rejected' && <AlertTriangle size={14} />}
                        {claim.status === 'approved' ? t('providerDashboard.aprobado') : claim.status === 'pending' ? t('providerDashboard.pendienteRevision') : t('providerDashboard.rechazado')}
                      </span>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8, margin: '14px 0', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                      <strong>{t('providerDashboard.descripcionIncidente')}:</strong> {claim.description}
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
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('providerDashboard.montoSolicitado')}: </span>
                        <strong style={{ color: '#ea580c', fontSize: '1.125rem' }}>${claim.amount} ETH</strong>
                      </div>

                      {claim.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            onClick={() => handleApproveClaim(claim.id)}
                            disabled={actionLoadingId === claim.id}
                            className="btn-primary"
                            style={{ background: '#16a34a', padding: '8px 16px', fontSize: '0.875rem' }}
                          >
                            ✓ {t('providerDashboard.aprobarReclamo')}
                          </button>
                          <button
                            onClick={() => handleRejectClaim(claim.id)}
                            disabled={actionLoadingId === claim.id}
                            className="btn-secondary"
                            style={{ color: '#f54242', padding: '8px 16px', fontSize: '0.875rem' }}
                          >
                            ✕ {t('providerDashboard.rechazar')}
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{t('providerDashboard.crearPlanTitle')}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                  {t('providerDashboard.ofreceServicios')}
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
                  {t('providerDashboard.tituloServicio')}
                </label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('providerDashboard.placeholderTitulo')}
                  required
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                    {t('providerDashboard.categoria')}
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
                    {t('providerDashboard.duracionDias')}
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
                    {t('providerDashboard.precioMensualLabel')}
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={t('providerDashboard.placeholderPrecio')}
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                    {t('providerDashboard.limiteCobertura')}
                  </label>
                  <input 
                    type="number" 
                    step="1"
                    min="10"
                    value={coverage}
                    onChange={(e) => setCoverage(e.target.value)}
                    placeholder={t('providerDashboard.placeholderCobertura')}
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                  {t('providerDashboard.descripcionDetallada')}
                </label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('providerDashboard.placeholderDescripcion')}
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
                  {t('providerDashboard.cancelar')}
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="btn-primary"
                  style={{ background: '#16a34a' }}
                >
                  {creating ? t('providerDashboard.publicandoSepolia') : t('providerDashboard.publicarServicio')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
