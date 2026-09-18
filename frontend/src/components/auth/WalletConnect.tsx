import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, ArrowRight, CheckCircle, Shield, 
  Lock, ExternalLink, AlertCircle, Briefcase, UserCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const steps = [
  { label: 'Conectar', icon: Wallet },
  { label: 'Firmar', icon: Lock },
  { label: 'Elegir Rol', icon: UserCheck },
  { label: 'Listo', icon: CheckCircle },
];

const wallets = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Extensión popular para navegadores y móviles',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'Billetera de autocustodia y Passkeys',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect / Móvil',
    icon: '🔗',
    description: 'Conecta cualquier billetera escaneando código QR',
  },
];

export default function WalletConnect() {
  const navigate = useNavigate();
  const { walletAddress, role, signIn, updateRole, signOut } = useAuth();
  const [step, setStep] = useState(walletAddress ? 2 : 0);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [chosenRole, setChosenRole] = useState<'customer' | 'provider'>(role || 'customer');

  const handleSelectWallet = async (wallet: typeof wallets[0]) => {
    setSelectedWallet(wallet.name);
    setStep(1);
    setError(null);
    setIsSigning(true);

    try {
      await signIn();
      // After signature, show role selection step
      setStep(2);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      let errorMsg = 'Error al conectar la billetera. Por favor intenta de nuevo.';
      if (err.message) {
        if (err.message.includes('User rejected') || err.message.includes('rejected')) {
          errorMsg = 'Firma rechazada por el usuario en la billetera.';
        } else if (err.message.includes('No se detectó')) {
          errorMsg = 'No se encontró la extensión MetaMask o billetera Web3 instalada.';
        } else {
          errorMsg = err.message;
        }
      }
      setError(errorMsg);
      setStep(0);
    } finally {
      setIsSigning(false);
    }
  };

  const handleConfirmRole = async () => {
    try {
      await updateRole(chosenRole);
      setStep(3);
    } catch (err) {
      console.error('Failed to update role:', err);
      setStep(3);
    }
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  // Paso 3: Completado / Conectado
  if (step === 3 && walletAddress) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo" style={{ background: chosenRole === 'provider' ? '#16a34a' : '#2563eb' }}>
            <CheckCircle size={28} color="white" />
          </div>
          <h1 className="auth-title">¡Sesión Iniciada!</h1>
          <p className="auth-subtitle">
            Ingresando como <strong>{chosenRole === 'provider' ? '🩺 Proveedor / Vendedor' : '🛡️ Cliente / Paciente'}</strong>
          </p>
          
          <div style={{
            padding: 16,
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            marginBottom: 24,
            textAlign: 'left',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              Dirección Autenticada
            </div>
            <div style={{ 
              fontFamily: 'monospace', 
              fontSize: '0.875rem',
              wordBreak: 'break-all',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
              <a 
                href={`https://polygonscan.com/address/${walletAddress}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', color: 'inherit' }}
              >
                <ExternalLink size={14} color="var(--text-muted)" />
              </a>
            </div>
          </div>

          <button className="auth-btn" onClick={handleContinue} style={{ background: chosenRole === 'provider' ? '#16a34a' : 'var(--primary)' }}>
            Entrar a Mi Dashboard <ArrowRight size={18} />
          </button>
          
          <p className="auth-footer" style={{ marginTop: 16 }}>
            <a href="#" onClick={(e) => {
              e.preventDefault();
              signOut();
              setStep(0);
            }}>Cerrar Sesión</a>
          </p>
        </div>
      </div>
    );
  }

  // Paso 2: Selección de Rol
  if (step === 2 && walletAddress) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ maxWidth: 520 }}>
          <div className="auth-logo" style={{ background: 'var(--primary)' }}>
            <UserCheck size={28} color="white" />
          </div>

          <h1 className="auth-title">¿Cómo deseas ingresar?</h1>
          <p className="auth-subtitle">
            Selecciona el tipo de cuenta con el que deseas acceder a NoPayForNothing.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '24px 0' }}>
            {/* Opción Cliente */}
            <div
              onClick={() => setChosenRole('customer')}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: '18px 20px',
                borderRadius: 14,
                border: chosenRole === 'customer' ? '2px solid #2563eb' : '1px solid var(--border)',
                background: chosenRole === 'customer' ? 'rgba(37, 99, 235, 0.06)' : 'var(--bg-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: chosenRole === 'customer' ? '#2563eb' : 'inherit' }}>
                  Soy Cliente / Paciente
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                  Quiero contratar garantías de servicios (mecánicos, doctores, dentistas, etc.), gestionar mis suscripciones y radicar reclamos.
                </div>
              </div>
            </div>

            {/* Opción Proveedor */}
            <div
              onClick={() => setChosenRole('provider')}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: '18px 20px',
                borderRadius: 14,
                border: chosenRole === 'provider' ? '2px solid #16a34a' : '1px solid var(--border)',
                background: chosenRole === 'provider' ? 'rgba(22, 163, 74, 0.06)' : 'var(--bg-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Briefcase size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: chosenRole === 'provider' ? '#16a34a' : 'inherit' }}>
                  Soy Proveedor / Vendedor de Servicios
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                  Soy doctor, mecánico, dentista o profesional. Quiero ofrecer garantías, crear planes de servicio y gestionar a mis pacientes/clientes.
                </div>
              </div>
            </div>
          </div>

          <button className="auth-btn" onClick={handleConfirmRole} style={{ background: chosenRole === 'provider' ? '#16a34a' : 'var(--primary)' }}>
            Continuar como {chosenRole === 'provider' ? 'Proveedor' : 'Cliente'} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Pasos 0 y 1: Selección de Wallet y Firma
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <Shield size={28} color="white" />
        </div>
        
        <div className="steps-indicator">
          {steps.map((_s, i) => (
            <div 
              key={i}
              className="step-dot"
              style={{
                width: step === i ? 28 : 8,
                background: i <= step ? 'var(--primary)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        <h1 className="auth-title">
          {step === 0 && 'Conectar Billetera'}
          {step === 1 && 'Conectando y Firmando...'}
        </h1>
        
        <p className="auth-subtitle">
          {step === 0 && 'Elige tu billetera para acceder a tus garantías en NoPayForNothing'}
          {step === 1 && `Por favor aprueba la firma de autenticación (SIWE) en ${selectedWallet}...`}
        </p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: 12,
            background: 'rgba(245, 66, 66, 0.1)',
            borderRadius: 8,
            marginBottom: 16,
            color: '#f54242',
            fontSize: '0.875rem',
            textAlign: 'left',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleSelectWallet(wallet)}
                disabled={isSigning}
                className="auth-btn"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  justifyContent: 'flex-start',
                  padding: '16px 20px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{wallet.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>{wallet.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {wallet.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 16,
            padding: '24px 0',
          }}>
            <div className="animate-spin" style={{
              width: 48,
              height: 48,
              border: '3px solid var(--border)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
            }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Firma el mensaje criptográfico en tu billetera para verificar tu identidad...
            </p>
          </div>
        )}

        <div className="auth-note">
          <strong>Seguridad:</strong> NoPayForNothing nunca solicita ni almacena tus claves privadas.
        </div>

        <p className="auth-footer">
          ¿Nuevo en Web3?{' '}
          <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
            Descargar MetaMask
          </a>
        </p>
      </div>
    </div>
  );
}
