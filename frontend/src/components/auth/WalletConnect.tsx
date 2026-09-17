import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight, CheckCircle, Shield, Lock, ExternalLink, AlertCircle } from 'lucide-react';

const steps = [
  { label: 'Connect', icon: Wallet },
  { label: 'Sign', icon: Lock },
  { label: 'Verified', icon: CheckCircle },
];

const wallets = [
  { name: 'MetaMask', icon: '🦊', description: 'Popular browser extension wallet' },
  { name: 'Coinbase Wallet', icon: '🔵', description: 'Coinbase self-custody wallet' },
  { name: 'WalletConnect', icon: '🔗', description: 'Scan QR code with any wallet' },
];

export default function WalletConnect() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('wallet_address');
    if (stored) {
      setWalletAddress(stored);
      setStep(2);
    }
  }, []);

  const handleSelectWallet = async (walletName: string) => {
    setSelectedWallet(walletName);
    setStep(1);
    setError(null);

    try {
      await new Promise(r => setTimeout(r, 1500));
      const mockAddress = '0x' + Array.from({ length: 40 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      setWalletAddress(mockAddress);
      localStorage.setItem('wallet_address', mockAddress);
      setStep(2);
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
      setStep(0);
    }
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  if (walletAddress) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo" style={{ background: '#00b35e' }}>
            <CheckCircle size={28} color="white" />
          </div>
          <h1 className="auth-title">Wallet Connected!</h1>
          <p className="auth-subtitle">
            Your wallet is connected and ready to use.
          </p>
          
          <div style={{
            padding: 16,
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            marginBottom: 24,
            textAlign: 'left',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              Connected Address
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
              <ExternalLink size={14} color="var(--text-muted)" />
            </div>
          </div>

          <button className="auth-btn" onClick={handleContinue}>
            Go to Dashboard <ArrowRight size={18} />
          </button>
          
          <p className="auth-footer" style={{ marginTop: 16 }}>
            <a href="#" onClick={(e) => {
              e.preventDefault();
              localStorage.removeItem('wallet_address');
              setWalletAddress(null);
              setStep(0);
            }}>Disconnect Wallet</a>
          </p>
        </div>
      </div>
    );
  }

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
                width: step === i ? 32 : 8,
                background: i <= step ? 'var(--primary)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        <h1 className="auth-title">
          {step === 0 && 'Connect Wallet'}
          {step === 1 && 'Connecting...'}
          {step === 2 && 'Connected!'}
        </h1>
        
        <p className="auth-subtitle">
          {step === 0 && 'Choose your preferred wallet to connect to NoPayForNothing'}
          {step === 1 && `Connecting to ${selectedWallet}...`}
          {step === 2 && 'Your wallet is connected'}
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
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {wallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleSelectWallet(wallet.name)}
                className="auth-btn"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  justifyContent: 'flex-start',
                  padding: '16px 20px',
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
          }}>
            <div className="animate-spin" style={{
              width: 48,
              height: 48,
              border: '3px solid var(--border)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
            }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Please approve in your wallet...
            </p>
          </div>
        )}

        <div className="auth-note">
          <strong>Note:</strong> NoPayForNothing never stores your private keys. 
          All transactions are signed locally in your wallet.
        </div>

        <p className="auth-footer">
          New to Ethereum?{' '}
          <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
            Learn more about wallets
          </a>
        </p>
      </div>
    </div>
  );
}
