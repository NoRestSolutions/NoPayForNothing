import { useAuth } from '../hooks/useAuth';
import CustomerDashboard from './CustomerDashboard';
import ProviderDashboard from './ProviderDashboard';
import { Wallet, Shield, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { walletAddress, role, updateRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: 44, height: 44, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Cargando tu sesión de NoPayForNothing...</p>
        </div>
      </main>
    );
  }

  if (!walletAddress) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="auth-card" style={{ maxWidth: 480, textAlign: 'center' }}>
          <div className="auth-logo" style={{ margin: '0 auto 20px' }}>
            <Wallet size={28} color="white" />
          </div>
          <h2 className="auth-title">Acceso al Dashboard</h2>
          <p className="auth-subtitle" style={{ marginBottom: 28 }}>
            Conecta tu billetera MetaMask para administrar tus contratos o tus pacientes.
          </p>
          <Link to="/wallet-connect" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Conectar Billetera <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div>
      {/* Top Banner de Conmutación Rápida de Rol */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '8px 24px' }}>
        <div className="section-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
            <span>Sesión activa: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</strong></span>
            <span>•</span>
            <span>Modo actual: <strong style={{ color: role === 'provider' ? '#16a34a' : '#2563eb' }}>{role === 'provider' ? '🩺 Proveedor / Vendedor' : '🛡️ Cliente / Paciente'}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--text-muted)' }}>Cambiar vista:</span>
            <button
              onClick={() => updateRole('customer')}
              className={`btn-secondary ${role === 'customer' ? 'active' : ''}`}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                background: role === 'customer' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                borderColor: role === 'customer' ? '#2563eb' : 'var(--border)',
                color: role === 'customer' ? '#2563eb' : 'inherit',
              }}
            >
              <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
              Vista Cliente
            </button>
            <button
              onClick={() => updateRole('provider')}
              className={`btn-secondary ${role === 'provider' ? 'active' : ''}`}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                background: role === 'provider' ? 'rgba(22, 163, 74, 0.15)' : 'transparent',
                borderColor: role === 'provider' ? '#16a34a' : 'var(--border)',
                color: role === 'provider' ? '#16a34a' : 'inherit',
              }}
            >
              <Briefcase size={12} style={{ display: 'inline', marginRight: 4 }} />
              Vista Proveedor
            </button>
          </div>
        </div>
      </div>

      {role === 'provider' ? <ProviderDashboard /> : <CustomerDashboard />}
    </div>
  );
}
