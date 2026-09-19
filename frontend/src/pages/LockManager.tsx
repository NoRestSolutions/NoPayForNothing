import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Lock, Plus, Wallet, ExternalLink, RefreshCw,
  Key, Users, AlertTriangle, CheckCircle, X
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { deployLock, getExplorerUrl } from '../lib/unlock';

interface ServiceItem {
  id: string;
  title: string;
  lock_address?: string;
  network_id: number;
  price_usd: number;
  coverage_amount: number;
  active_members: number;
  status: string;
}

interface LockData {
  address: string;
  name: string;
  totalKeys: number;
  outstandingKeys: number;
  maxNumberOfKeys: number;
  expirationDuration: number;
  keyPrice: string;
  balance: string;
}

interface KeyData {
  id: string;
  lock: string;
  owner: string;
  expiration: number;
  tokenID: string;
}

export default function LockManager() {
  const { t } = useTranslation();
  const { walletAddress } = useAuth();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLock, setSelectedLock] = useState<string | null>(null);
  const [lockDetails, setLockDetails] = useState<LockData | null>(null);
  const [lockKeys, setLockKeys] = useState<KeyData[]>([]);
  const [loadingLock, setLoadingLock] = useState(false);

  // Create lock modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [lockName, setLockName] = useState('');
  const [lockPrice, setLockPrice] = useState('0.01');
  const [lockDuration, setLockDuration] = useState(2592000); // 30 days in seconds
  const [lockMaxKeys, setLockMaxKeys] = useState(100);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployedLockAddress, setDeployedLockAddress] = useState('');
  const [linking, setLinking] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.getServices(1, 50);
      const list = res?.data || (Array.isArray(res) ? res : []);
      setServices(list);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) fetchServices();
  }, [walletAddress]);

  const servicesWithLock = services.filter(s => s.lock_address);
  const servicesWithoutLock = services.filter(s => !s.lock_address);

  const handleViewLock = async (lockAddress: string) => {
    setSelectedLock(lockAddress);
    setLoadingLock(true);
    setLockDetails(null);
    setLockKeys([]);
    try {
      const [details, keys] = await Promise.all([
        api.getLockDetails(lockAddress).catch(() => null),
        api.getLockKeys(lockAddress).catch(() => []),
      ]);
      setLockDetails(details);
      setLockKeys(Array.isArray(keys) ? keys : []);
    } catch (err) {
      console.error('Error fetching lock data:', err);
    } finally {
      setLoadingLock(false);
    }
  };

  const handleDeploy = async () => {
    if (!lockName.trim()) {
      setDeployError(t('lockManager.ingresaNombre'));
      return;
    }
    setDeploying(true);
    setDeployError(null);

    try {
      const result = await deployLock({
        name: lockName.trim(),
        keyPrice: lockPrice,
        expirationDuration: lockDuration,
        maxNumberOfKeys: lockMaxKeys,
      });

      setDeployedLockAddress(result.lockAddress);
      setCreateStep(2);
    } catch (err: any) {
      if (err.message?.startsWith('CHECKOUT_FALLBACK:')) {
        setDeployError(t('lockManager.checkoutFallback'));
        setTimeout(() => {
          window.open('https://app.unlock-protocol.com/locks', '_blank');
        }, 1500);
      } else {
        setDeployError(err.message || t('lockManager.errorDesplegar'));
      }
    } finally {
      setDeploying(false);
    }
  };

  const handleLink = async () => {
    if (!selectedServiceId || !deployedLockAddress) return;
    setLinking(true);
    try {
      await api.linkServiceToLock(selectedServiceId, deployedLockAddress);
      setCreateStep(3);
      await fetchServices();
    } catch (err: any) {
      setDeployError(err.message || t('lockManager.errorVincular'));
    } finally {
      setLinking(false);
    }
  };

  const resetCreateModal = () => {
    setShowCreateModal(false);
    setCreateStep(0);
    setLockName('');
    setLockPrice('0.01');
    setLockDuration(2592000);
    setLockMaxKeys(100);
    setSelectedServiceId('');
    setDeployError(null);
    setDeployedLockAddress('');
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return t('lockManager.sinExp');
    const days = Math.floor(seconds / 86400);
    if (days >= 365) return `${Math.floor(days / 365)} ${t('lockManager.ano')}`;
    return `${days} ${t('lockManager.dias')}`;
  };

  const formatPrice = (wei: string) => {
    try {
      const eth = parseFloat(wei) / 1e18;
      return `${eth.toFixed(4)} ETH`;
    } catch {
      return wei;
    }
  };

  if (!walletAddress || !api.getToken()) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo"><Wallet size={28} color="white" /></div>
          <h2 className="auth-title">{t('lockManager.conectaBilletera')}</h2>
          <p className="auth-subtitle">{t('lockManager.iniciaSesion')}</p>
          <Link to="/wallet-connect" className="btn-primary" style={{ justifyContent: 'center' }}>
            {t('lockManager.conectarBilletera')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* Header */}
      <div className="dashboard-header" style={{ background: 'linear-gradient(180deg, rgba(105, 54, 255, 0.08) 0%, transparent 100%)' }}>
        <div className="section-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(105, 54, 255, 0.1)', color: 'var(--primary)', borderRadius: 20, fontSize: '0.8125rem', fontWeight: 600, marginBottom: 8 }}>
                <Lock size={14} /> {t('lockManager.gestorLocks')}
              </div>
              <h1 className="dashboard-title">{t('lockManager.adminLocks')}</h1>
              <p className="dashboard-subtitle">
                {t('lockManager.creaVincula')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={fetchServices} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px' }}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {t('lockManager.actualizar')}
              </button>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> {t('lockManager.crearNuevoLock')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Stats */}
        <div className="stats-row">
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(105, 54, 255, 0.1)', color: 'var(--primary)' }}>
              <Lock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('lockManager.locksDesplegados')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{servicesWithLock.length}</div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(0, 214, 114, 0.1)', color: 'var(--success)' }}>
              <Key size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('lockManager.serviciosSinLock')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{servicesWithoutLock.length}</div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('lockManager.totalServicios')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{services.length}</div>
            </div>
          </div>
        </div>

        {/* Locks List */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20 }}>{t('lockManager.locksActivos')}</h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
              {t('lockManager.cargandoLocks')}
            </div>
          ) : servicesWithLock.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px dashed var(--border)' }}>
              <Lock size={48} color="var(--primary)" style={{ opacity: 0.6, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>{t('lockManager.noLocks')}</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 24px' }}>
                {t('lockManager.creaPrimerLock')}
              </p>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                <Plus size={16} /> {t('lockManager.crearPrimerLock')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
              {servicesWithLock.map((service) => (
                <div
                  key={service.id}
                  className="lock-card"
                  onClick={() => handleViewLock(service.lock_address!)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>{service.title}</h3>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {service.lock_address!.slice(0, 10)}...{service.lock_address!.slice(-8)}
                        <a
                          href={getExplorerUrl(service.lock_address!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: 'inline-flex', color: 'var(--primary)' }}
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                    <span className="status-badge status-active">
                      <CheckCircle size={14} /> {t('lockManager.activo')}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('lockManager.precioMensual')}</div>
                      <div style={{ fontWeight: 700, color: 'var(--success)' }}>${service.price_usd} ETH</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('lockManager.coberturaMax')}</div>
                      <div style={{ fontWeight: 700 }}>${service.coverage_amount} USD</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('lockManager.suscriptores')}</div>
                      <div style={{ fontWeight: 700 }}>{service.active_members || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('lockManager.network')}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Sepolia ({service.network_id})</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lock Detail Panel */}
        {selectedLock && (
          <div className="lock-detail-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('lockManager.detalleLock')}</h2>
              <button onClick={() => setSelectedLock(null)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                <X size={14} /> {t('lockManager.cerrar')}
              </button>
            </div>

            {loadingLock ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 12px' }} />
                {t('lockManager.consultandoChain')}
              </div>
            ) : lockDetails ? (
              <div>
                <div className="lock-detail-grid">
                  <div className="lock-detail-item">
                    <div className="lock-detail-label">{t('lockManager.nombre')}</div>
                    <div className="lock-detail-value">{lockDetails.name}</div>
                  </div>
                  <div className="lock-detail-item">
                    <div className="lock-detail-label">{t('lockManager.direccion')}</div>
                    <div className="lock-detail-value" style={{ fontFamily: 'monospace', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {lockDetails.address.slice(0, 16)}...{lockDetails.address.slice(-8)}
                      <a href={getExplorerUrl(lockDetails.address)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  <div className="lock-detail-item">
                    <div className="lock-detail-label">{t('lockManager.precioKey')}</div>
                    <div className="lock-detail-value">{formatPrice(lockDetails.keyPrice)}</div>
                  </div>
                  <div className="lock-detail-item">
                    <div className="lock-detail-label">{t('lockManager.expiracion')}</div>
                    <div className="lock-detail-value">{formatDuration(lockDetails.expirationDuration)}</div>
                  </div>
                  <div className="lock-detail-item">
                    <div className="lock-detail-label">{t('lockManager.keysTotales')}</div>
                    <div className="lock-detail-value">{lockDetails.totalKeys}</div>
                  </div>
                  <div className="lock-detail-item">
                    <div className="lock-detail-label">{t('lockManager.keysActivas')}</div>
                    <div className="lock-detail-value">{lockDetails.outstandingKeys}</div>
                  </div>
                  <div className="lock-detail-item">
                    <div className="lock-detail-label">{t('lockManager.maximoKeys')}</div>
                    <div className="lock-detail-value">{lockDetails.maxNumberOfKeys}</div>
                  </div>
                  <div className="lock-detail-item">
                    <div className="lock-detail-label">{t('lockManager.balance')}</div>
                    <div className="lock-detail-value">{formatPrice(lockDetails.balance)}</div>
                  </div>
                </div>

                {/* Key Holders */}
                <div style={{ marginTop: 32 }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Key size={18} /> {t('lockManager.titularesKeys')} ({lockKeys.length})
                  </h3>

                  {lockKeys.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--bg-secondary)', borderRadius: 12, color: 'var(--text-muted)' }}>
                        {t('lockManager.noKeys')}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="key-holder-header">
                        <span>{t('lockManager.titular')}</span>
                        <span>{t('lockManager.tokenId')}</span>
                        <span>{t('lockManager.expira')}</span>
                      </div>
                      {lockKeys.map((key) => (
                        <div key={key.id} className="key-holder-row">
                          <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                            {key.owner.slice(0, 8)}...{key.owner.slice(-6)}
                          </span>
                          <span>{key.tokenID}</span>
                          <span style={{ color: key.expiration > Date.now() / 1000 ? 'var(--success)' : 'var(--text-muted)' }}>
                            {key.expiration === 0 ? t('lockManager.sinExp') : new Date(key.expiration * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                {t('lockManager.errorCargarDatos')}
              </div>
            )}
          </div>
        )}

        {/* Services without Lock */}
        {servicesWithoutLock.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 16 }}>{t('lockManager.serviciosSinLockTitle')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {servicesWithoutLock.map((service) => (
                <div key={service.id} className="contract-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{service.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('lockManager.sinLockVinculado')}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedServiceId(service.id);
                      setLockName(service.title);
                      setShowCreateModal(true);
                    }}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.875rem', background: 'var(--primary)' }}
                  >
                    <Lock size={14} /> {t('lockManager.vincularLock')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Lock Modal */}
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
            <button onClick={resetCreateModal} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>

            {/* Step Indicator */}
            <div className="steps-indicator" style={{ marginBottom: 24 }}>
              {[t('lockManager.configurar'), t('lockManager.desplegar'), t('lockManager.vincular'), t('lockManager.listo')].map((label, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div
                    className="step-dot"
                    style={{
                      width: createStep >= i ? 28 : 8,
                      background: createStep >= i ? 'var(--primary)' : 'var(--border)',
                    }}
                  />
                  <span style={{ fontSize: '0.6875rem', color: createStep >= i ? 'var(--primary)' : 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Step 0: Configure Lock */}
            {createStep === 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(105, 54, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={22} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{t('lockManager.configurarLock')}</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>{t('lockManager.defineParametros')}</p>
                  </div>
                </div>

                {deployError && (
                  <div style={{ padding: 12, background: 'rgba(245, 66, 66, 0.1)', color: '#f54242', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>
                    <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6 }} />
                    {deployError}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>{t('lockManager.nombreLock')}</label>
                  <input
                    type="text"
                    value={lockName}
                    onChange={(e) => setLockName(e.target.value)}
                    placeholder={t('lockManager.ejemploLock')}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>{t('lockManager.precioPorKey')}</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={lockPrice}
                      onChange={(e) => setLockPrice(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>{t('lockManager.maximoDeKeys')}</label>
                    <input
                      type="number"
                      min="1"
                      value={lockMaxKeys}
                      onChange={(e) => setLockMaxKeys(parseInt(e.target.value) || 100)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>{t('lockManager.duracion')}</label>
                  <input
                    type="number"
                    min="1"
                    value={Math.floor(lockDuration / 86400)}
                    onChange={(e) => setLockDuration((parseInt(e.target.value) || 30) * 86400)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={resetCreateModal} className="btn-secondary">{t('lockManager.cancelar')}</button>
                  <button onClick={handleDeploy} disabled={deploying} className="btn-primary">
                    {deploying ? t('lockManager.desplegando') : t('lockManager.desplegarLock')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Deploying (handled in step 0) */}

            {/* Step 2: Link to Service */}
            {createStep === 2 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0, 214, 114, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={22} color="var(--success)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{t('lockManager.lockDesplegado')}</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>{t('lockManager.ahoraVincula')}</p>
                  </div>
                </div>

                <div style={{ padding: 12, background: 'rgba(0, 214, 114, 0.08)', borderRadius: 8, marginBottom: 20, fontSize: '0.875rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('lockManager.direccionLock')}</div>
                  <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {deployedLockAddress}
                    <a href={getExplorerUrl(deployedLockAddress)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', flexShrink: 0 }}>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                {deployError && (
                  <div style={{ padding: 12, background: 'rgba(245, 66, 66, 0.1)', color: '#f54242', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>
                    <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6 }} />
                    {deployError}
                  </div>
                )}

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>{t('lockManager.seleccionaServicio')}</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                  >
                    <option value="">{t('lockManager.seleccionaServicioOpcion')}</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}{s.lock_address ? ' (ya tiene lock)' : ''}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button onClick={() => setCreateStep(3)} className="btn-secondary" style={{ fontSize: '0.875rem' }}>{t('lockManager.omitir')}</button>
                  <button onClick={handleLink} disabled={!selectedServiceId || linking} className="btn-primary" style={{ background: 'var(--success)' }}>
                    {linking ? t('lockManager.vinculando') : t('lockManager.vincularLockServicio')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {createStep === 3 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(0, 214, 114, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={32} color="var(--success)" />
                </div>
                <h3 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: 8 }}>{t('lockManager.lockCreado')}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                  {t('lockManager.lockDesplegadoVinculado')}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button onClick={resetCreateModal} className="btn-primary">{t('lockManager.cerrarBtn')}</button>
                  <a href={`https://app.unlock-protocol.com/locks`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {t('lockManager.verUnlockDashboard')} <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
