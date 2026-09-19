import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setClaimError(t('customerDashboard.montoValido'));
      return;
    }

    if (selectedContract.coverage_amount && amountNum > selectedContract.coverage_amount) {
      setClaimError(t('customerDashboard.montoLimite', { amount: selectedContract.coverage_amount }));
      return;
    }

    if (!claimDescription.trim()) {
      setClaimError(t('customerDashboard.motivoReclamo'));
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

      setClaimSuccess(t('customerDashboard.reclamoExito'));
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
      setClaimError(err.message || t('customerDashboard.errorReclamo'));
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleTerminateContract = async (contractId: string) => {
    if (!window.confirm(t('customerDashboard.confirmarCancelacion'))) return;
    setTerminatingId(contractId);
    try {
      await api.terminateContract(contractId);
      await fetchData();
    } catch (err: any) {
      alert(err.message || t('customerDashboard.errorCancelar'));
    } finally {
      setTerminatingId(null);
    }
  };

  if (!walletAddress || !api.getToken()) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo"><Wallet size={28} color="white" /></div>
          <h2 className="auth-title">{t('customerDashboard.conectaBilletera')}</h2>
          <p className="auth-subtitle">{t('customerDashboard.conectaBilleteraDesc')}</p>
          <Link to="/wallet-connect" className="btn-primary" style={{ justifyContent: 'center' }}>
            {t('customerDashboard.conectarBilletera')}
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
                <Shield size={14} /> {t('customerDashboard.panelCliente')}
              </div>
              <h1 className="dashboard-title">{t('customerDashboard.misGarantias')}</h1>
              <p className="dashboard-subtitle">
                {t('customerDashboard.supervisaContratos')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={fetchData} 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px' }}
                title={t('customerDashboard.actualizarDatos')}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {t('customerDashboard.actualizar')}
              </button>
              
              <button 
                onClick={() => {
                  updateRole('provider');
                  navigate('/dashboard/provider');
                }}
                className="btn-secondary"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                {t('customerDashboard.cambiarProveedor')}
              </button>

              <Link to="/services" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> {t('customerDashboard.contratarNueva')}
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
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('customerDashboard.garantiasActivas')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeContractsCount}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('customerDashboard.gastoMensual')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalMonthlySpend.toFixed(2)} ETH</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(105, 54, 255, 0.1)', color: 'var(--primary)' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('customerDashboard.coberturaTotal')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalCoverage.toLocaleString()} USD</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(245, 166, 35, 0.1)', color: '#f5a623' }}>
              <FileText size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('customerDashboard.reclamosPendientes')}</div>
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
            {t('customerDashboard.misSuscripciones')} ({contracts.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
            onClick={() => setActiveTab('claims')}
          >
            {t('customerDashboard.historialReclamos')} ({claims.length})
          </button>
        </div>

        {/* Listado de Contratos */}
        {activeTab === 'contracts' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
                {t('customerDashboard.cargandoBlockchain')}
              </div>
            ) : contracts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px dashed var(--border)' }}>
                <Shield size={48} color="var(--primary)" style={{ opacity: 0.6, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>{t('customerDashboard.noGarantias')}</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto 24px' }}>
                  {t('customerDashboard.exploraServicios')}
                </p>
                <Link to="/services" className="btn-primary">
                  {t('customerDashboard.explorarCatalogo')}
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {contracts.map((contract) => (
                  <div key={contract.id} className="contract-card" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>
                          {contract.service_title || t('customerDashboard.garantiaServicio')}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          🏢 {t('customerDashboard.proveedor')}: <strong style={{ color: 'var(--text-primary)' }}>{contract.provider_name || t('customerDashboard.proveedorVerificado')}</strong>
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`status-badge status-${contract.status}`}>
                          {contract.status === 'active' && <CheckCircle size={14} />}
                          {contract.status === 'claimed' && <Clock size={14} />}
                          {contract.status === 'terminated' && <AlertCircle size={14} />}
                          {contract.status === 'active' ? t('customerDashboard.activo') : contract.status === 'claimed' ? t('customerDashboard.reclamoEnProceso') : contract.status}
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
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('customerDashboard.precioMensual')}</div>
                        <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--primary)' }}>
                          ${contract.price_usd || 0} ETH
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('customerDashboard.coberturaGarantizada')}</div>
                        <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#00b35e' }}>
                          ${contract.coverage_amount?.toLocaleString() || 0} USD
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('customerDashboard.fechaInicio')}</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString() : t('customerDashboard.activa')}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('customerDashboard.redBlockchain')}</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          Sepolia (11155111)
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
                            {t('customerDashboard.radicarReclamo')}
                          </button>

                          <button
                            onClick={() => handleTerminateContract(contract.id)}
                            disabled={terminatingId === contract.id}
                            className="btn-secondary"
                            style={{ padding: '8px 16px', fontSize: '0.875rem', color: '#f54242' }}
                          >
                            {terminatingId === contract.id ? t('customerDashboard.cancelando') : t('customerDashboard.cancelarSuscripcion')}
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
                {t('customerDashboard.cargandoReclamos')}
              </div>
            ) : claims.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px dashed var(--border)' }}>
                <CheckCircle size={48} color="#00b35e" style={{ opacity: 0.6, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>{t('customerDashboard.noReclamos')}</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto' }}>
                  {t('customerDashboard.sinProblemas')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {claims.map((claim) => (
                  <div key={claim.id} className="contract-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>
                          {claim.service_title || t('customerDashboard.reclamoGarantia')}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          {t('customerDashboard.proveedor')}: <strong>{claim.provider_name || t('customerDashboard.proveedor')}</strong>
                        </p>
                      </div>

                      <span className={`status-badge status-${claim.status}`}>
                        {claim.status === 'approved' && <CheckCircle size={14} />}
                        {claim.status === 'pending' && <Clock size={14} />}
                        {claim.status === 'rejected' && <AlertCircle size={14} />}
                        {claim.status === 'approved' ? t('customerDashboard.aprobado') : claim.status === 'pending' ? t('customerDashboard.enRevision') : t('customerDashboard.rechazado')}
                      </span>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8, margin: '14px 0', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                      <strong>{t('customerDashboard.motivoReclamoLabel')}</strong> {claim.description}
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      gap: 24,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                      fontSize: '0.875rem',
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>{t('customerDashboard.montoSolicitado')}</span>
                        <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>${claim.amount} ETH</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>{t('customerDashboard.fecha')}</span>
                        <strong>{claim.created_at ? new Date(claim.created_at).toLocaleDateString() : t('customerDashboard.reciente')}</strong>
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{t('customerDashboard.tituloRadicar')}</h3>
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
                    {t('customerDashboard.montoReclamar')}
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="1" 
                    max={selectedContract.coverage_amount || 10000}
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder={t('customerDashboard.montoMaxPlaceholder', { amount: selectedContract.coverage_amount || 0 })}
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {t('customerDashboard.limiteCobertura', { amount: selectedContract.coverage_amount || 0 })}
                  </span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                    {t('customerDashboard.explicacionIncidente')}
                  </label>
                  <textarea 
                    rows={4}
                    value={claimDescription}
                    onChange={(e) => setClaimDescription(e.target.value)}
                    placeholder={t('customerDashboard.descripcionPlaceholder')}
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                    {t('customerDashboard.enlaceEvidencia')}
                  </label>
                  <input 
                    type="url" 
                    value={claimEvidence}
                    onChange={(e) => setClaimEvidence(e.target.value)}
                    placeholder={t('customerDashboard.evidenciaPlaceholder')}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => setSelectedContract(null)}
                    className="btn-secondary"
                  >
                    {t('customerDashboard.cancelar')}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingClaim}
                    className="btn-primary"
                  >
                    {submittingClaim ? t('customerDashboard.enviandoBlockchain') : t('customerDashboard.confirmarRadicar')}
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
