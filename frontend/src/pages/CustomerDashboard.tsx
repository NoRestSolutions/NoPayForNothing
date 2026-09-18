import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, FileText, Clock, 
  CheckCircle, TrendingUp,
  Wallet, AlertCircle, Plus,
  Sparkles, ExternalLink, X, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface ContractItem {
  id: string;
  service_id: string;
  service_title?: string;
  provider_name?: string;
  customer_address?: string;
  price_usd?: number;
  coverage_amount?: number;
  status: string;
  signed_at?: string;
  expires_at?: string;
  lock_address?: string;
}

interface ClaimItem {
  id: string;
  contract_id: string;
  service_title?: string;
  provider_name?: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  resolved_at?: string;
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { walletAddress, updateRole } = useAuth();
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contracts' | 'claims'>('contracts');
  
  // Modal de Reclamos
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);
  const [claimAmount, setClaimAmount] = useState('');
  const [claimDescription, setClaimDescription] = useState('');
  const [claimEvidence, setClaimEvidence] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  // Terminación de contrato
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractsRes, claimsRes] = await Promise.all([
        api.getContracts('customer').catch(() => []),
        api.getClaims('customer').catch(() => []),
      ]);
      setContracts(Array.isArray(contractsRes) ? contractsRes : []);
      setClaims(Array.isArray(claimsRes) ? claimsRes : []);
    } catch (err) {
      console.error('Error fetching customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchData();
    }
  }, [walletAddress]);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    const amountNum = parseFloat(claimAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setClaimError('Por favor ingresa un monto válido.');
      return;
    }

    if (selectedContract.coverage_amount && amountNum > selectedContract.coverage_amount) {
      setClaimError(`El monto no puede exceder el límite de cobertura de $${selectedContract.coverage_amount} USD.`);
      return;
    }

    if (!claimDescription.trim()) {
      setClaimError('Por favor explica el motivo del reclamo.');
      return;
    }

    setSubmittingClaim(true);
    setClaimError(null);

    try {
      await api.createClaim(selectedContract.id, {
        amount: amountNum,
        description: claimDescription.trim(),
        evidence_urls: claimEvidence ? [claimEvidence.trim()] : [],
      });

      setClaimSuccess('¡Reclamo radicado con éxito! El proveedor ha sido notificado para su revisión.');
      setClaimAmount('');
      setClaimDescription('');
      setClaimEvidence('');
      fetchData();
      setTimeout(() => {
        setSelectedContract(null);
        setClaimSuccess(null);
        setActiveTab('claims');
      }, 1800);
    } catch (err: any) {
      setClaimError(err.message || 'Error al radicar el reclamo.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleTerminateContract = async (contractId: string) => {
    if (!window.confirm('¿Estás seguro de cancelar esta suscripción de garantía?')) return;
    setTerminatingId(contractId);
    try {
      await api.terminateContract(contractId);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al cancelar contrato');
    } finally {
      setTerminatingId(null);
    }
  };

  if (!walletAddress) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo"><Wallet size={28} color="white" /></div>
          <h2 className="auth-title">Conecta tu Billetera</h2>
          <p className="auth-subtitle">Conecta tu billetera para administrar tus suscripciones y garantías.</p>
          <Link to="/wallet-connect" className="btn-primary" style={{ justifyContent: 'center' }}>
            Conectar Billetera
          </Link>
        </div>
      </main>
    );
  }

  // Cálculos de estadísticas
  const activeContractsCount = contracts.filter(c => c.status === 'active').length;
  const totalMonthlySpend = contracts
    .filter(c => c.status === 'active')
    .reduce((acc, c) => acc + (c.price_usd || 0), 0);
  const totalCoverage = contracts
    .filter(c => c.status === 'active')
    .reduce((acc, c) => acc + (c.coverage_amount || 0), 0);
  const pendingClaimsCount = claims.filter(cl => cl.status === 'pending').length;

  return (
    <main>
      {/* Header del Dashboard de Cliente */}
      <div className="dashboard-header" style={{ background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.08) 0%, transparent 100%)' }}>
        <div className="section-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', borderRadius: 20, fontSize: '0.8125rem', fontWeight: 600, marginBottom: 8 }}>
                <Shield size={14} /> Panel del Cliente / Paciente
              </div>
              <h1 className="dashboard-title">Mis Garantías y Suscripciones</h1>
              <p className="dashboard-subtitle">
                Supervisa tus contratos respaldados en blockchain, coberturas y radicación de reclamos.
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
                  updateRole('provider');
                  navigate('/dashboard/provider');
                }}
                className="btn-secondary"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                Cambiar a Modo Proveedor 🩺
              </button>

              <Link to="/services" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> Contratar Nueva Garantía
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Estadísticas Clave */}
        <div className="stats-row">
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(0, 214, 114, 0.1)', color: '#00b35e' }}>
              <Shield size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Garantías Activas</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeContractsCount}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Gasto Mensual</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalMonthlySpend.toFixed(2)} USD</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(105, 54, 255, 0.1)', color: 'var(--primary)' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Cobertura Protegida Total</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalCoverage.toLocaleString()} USD</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(245, 166, 35, 0.1)', color: '#f5a623' }}>
              <FileText size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Reclamos Pendientes</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pendingClaimsCount}</div>
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'contracts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contracts')}
          >
            Mis Suscripciones ({contracts.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
            onClick={() => setActiveTab('claims')}
          >
            Historial de Reclamos ({claims.length})
          </button>
        </div>

        {/* Listado de Contratos */}
        {activeTab === 'contracts' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
                Cargando tus suscripciones desde la blockchain...
              </div>
            ) : contracts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px dashed var(--border)' }}>
                <Shield size={48} color="var(--primary)" style={{ opacity: 0.6, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Aún no tienes garantías contratadas</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto 24px' }}>
                  Explora los servicios disponibles de médicos, mecánicos, dentistas y plomeros con garantías respaldadas en Polygon.
                </p>
                <Link to="/services" className="btn-primary">
                  Explorar Catálogo de Servicios
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {contracts.map((contract) => (
                  <div key={contract.id} className="contract-card" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>
                          {contract.service_title || 'Garantía de Servicio'}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          🏢 Proveedor: <strong style={{ color: 'var(--text-primary)' }}>{contract.provider_name || 'Proveedor Verificado'}</strong>
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`status-badge status-${contract.status}`}>
                          {contract.status === 'active' && <CheckCircle size={14} />}
                          {contract.status === 'claimed' && <Clock size={14} />}
                          {contract.status === 'terminated' && <AlertCircle size={14} />}
                          {contract.status === 'active' ? 'Activo' : contract.status === 'claimed' ? 'Reclamo en Proceso' : contract.status}
                        </span>
                      </div>
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
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Precio Mensual</div>
                        <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--primary)' }}>
                          ${contract.price_usd || 0} USD
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cobertura Garantizada</div>
                        <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#00b35e' }}>
                          ${contract.coverage_amount?.toLocaleString() || 0} USD
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fecha de Inicio</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString() : 'Activa'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Red Blockchain</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          Polygon (137)
                          <ExternalLink size={12} color="var(--text-muted)" />
                        </div>
                      </div>
                    </div>

                    {/* Acciones del contrato */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                      {contract.status === 'active' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedContract(contract);
                              setClaimError(null);
                              setClaimSuccess(null);
                            }}
                            className="btn-primary"
                            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                          >
                            Radicar Reclamo de Garantía 🛡️
                          </button>

                          <button
                            onClick={() => handleTerminateContract(contract.id)}
                            disabled={terminatingId === contract.id}
                            className="btn-secondary"
                            style={{ padding: '8px 16px', fontSize: '0.875rem', color: '#f54242' }}
                          >
                            {terminatingId === contract.id ? 'Cancelando...' : 'Cancelar Suscripción'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Listado de Reclamos */}
        {activeTab === 'claims' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
                Cargando historial de reclamos...
              </div>
            ) : claims.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px dashed var(--border)' }}>
                <CheckCircle size={48} color="#00b35e" style={{ opacity: 0.6, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>No tienes reclamos abiertos</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto' }}>
                  Todos tus servicios están funcionando correctamente. Si tienes un problema con una garantía activa, puedes radicar un reclamo desde la pestaña de suscripciones.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {claims.map((claim) => (
                  <div key={claim.id} className="contract-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>
                          {claim.service_title || 'Reclamo de Garantía'}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          Proveedor: <strong>{claim.provider_name || 'Proveedor'}</strong>
                        </p>
                      </div>

                      <span className={`status-badge status-${claim.status}`}>
                        {claim.status === 'approved' && <CheckCircle size={14} />}
                        {claim.status === 'pending' && <Clock size={14} />}
                        {claim.status === 'rejected' && <AlertCircle size={14} />}
                        {claim.status === 'approved' ? 'Aprobado / Pagado' : claim.status === 'pending' ? 'En Revisión' : 'Rechazado'}
                      </span>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8, margin: '14px 0', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                      <strong>Motivo del Reclamo:</strong> {claim.description}
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      gap: 24,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                      fontSize: '0.875rem',
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Monto Solicitado: </span>
                        <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>${claim.amount} USD</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Fecha: </span>
                        <strong>{claim.created_at ? new Date(claim.created_at).toLocaleDateString() : 'Reciente'}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para Radicar Reclamo */}
      {selectedContract && (
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
          <div className="auth-card" style={{ maxWidth: 520, width: '100%', position: 'relative', textAlign: 'left' }}>
            <button 
              onClick={() => setSelectedContract(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={22} color="#ea580c" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Radicar Reclamo de Garantía</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                  {selectedContract.service_title} ({selectedContract.provider_name})
                </p>
              </div>
            </div>

            {claimSuccess ? (
              <div style={{ padding: 20, background: 'rgba(0, 214, 114, 0.1)', color: '#00b35e', borderRadius: 8, textAlign: 'center' }}>
                <CheckCircle size={32} style={{ margin: '0 auto 8px' }} />
                <div>{claimSuccess}</div>
              </div>
            ) : (
              <form onSubmit={handleCreateClaim}>
                {claimError && (
                  <div style={{ padding: 12, background: 'rgba(245, 66, 66, 0.1)', color: '#f54242', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>
                    <AlertCircle size={16} style={{ display: 'inline', marginRight: 6 }} />
                    {claimError}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                    Monto a Reclamar (USD)
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="1" 
                    max={selectedContract.coverage_amount || 10000}
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder={`Máx $${selectedContract.coverage_amount || 0} USD`}
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Límite máximo de cobertura: ${selectedContract.coverage_amount || 0} USD
                  </span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                    Explicación del Incidente o Incumplimiento
                  </label>
                  <textarea 
                    rows={4}
                    value={claimDescription}
                    onChange={(e) => setClaimDescription(e.target.value)}
                    placeholder="Describe detalladamente qué problema ocurrió con el servicio garantizado..."
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                    Enlace de Evidencia / Factura (Opcional)
                  </label>
                  <input 
                    type="url" 
                    value={claimEvidence}
                    onChange={(e) => setClaimEvidence(e.target.value)}
                    placeholder="https://ipfs.io/... o enlace a imagen de diagnóstico"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => setSelectedContract(null)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingClaim}
                    className="btn-primary"
                  >
                    {submittingClaim ? 'Enviando a Blockchain...' : 'Confirmar y Radicar Reclamo'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
