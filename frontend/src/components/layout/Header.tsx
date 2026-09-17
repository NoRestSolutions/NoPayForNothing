import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Wallet } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/dashboard', label: 'Dashboard' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('wallet_address');
    if (stored) setWalletAddress(stored);
    
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleConnect = () => {
    if (!walletAddress) navigate('/wallet-connect');
  };

  const truncateAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        <Link to="/" className="header-logo">
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Wallet size={18} color="white" strokeWidth={2.5} />
          </div>
          NoPayForNothing
        </Link>

        <nav className="header-nav">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {walletAddress ? (
            <button className="btn-connect" disabled>
              <Wallet size={16} />
              {truncateAddress(walletAddress)}
            </button>
          ) : (
            <button className="btn-connect" onClick={handleConnect}>
              <Wallet size={16} />
              Connect
            </button>
          )}
          <button 
            className="mobile-menu-btn" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 72,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--bg-primary)',
          padding: '24px',
          zIndex: 999,
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {navLinks.map((link) => (
              <Link 
                key={link.to} 
                to={link.to} 
                className="nav-link"
                onClick={() => setMenuOpen(false)}
                style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}
              >
                {link.label}
              </Link>
            ))}
            <button 
              className="btn-connect" 
              onClick={() => {
                setMenuOpen(false);
                if (!walletAddress) navigate('/wallet-connect');
              }}
              style={{ marginTop: 16 }}
            >
              <Wallet size={16} />
              {walletAddress ? truncateAddress(walletAddress) : 'Connect Wallet'}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
