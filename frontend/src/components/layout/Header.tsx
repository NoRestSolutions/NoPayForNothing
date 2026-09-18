import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Wallet, Shield, Briefcase, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { walletAddress, role, updateRole, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const truncateAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/services', label: 'Servicios & Garantías' },
    { to: '/dashboard', label: 'Mi Dashboard' },
  ];

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        <Link to="/" className="header-logo">
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary) 0%, #00b35e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(105, 54, 255, 0.25)',
          }}>
            <Shield size={20} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>NoPayForNothing</span>
        </Link>

        <nav className="header-nav">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions" style={{ position: 'relative' }}>
          {walletAddress ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Badge de Rol */}
              <button
                onClick={() => updateRole(role === 'provider' ? 'customer' : 'provider')}
                title="Haz clic para alternar entre rol Cliente y rol Proveedor"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  background: role === 'provider' ? 'rgba(22, 163, 74, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                  color: role === 'provider' ? '#16a34a' : '#2563eb',
                  border: `1px solid ${role === 'provider' ? 'rgba(22, 163, 74, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`,
                  cursor: 'pointer',
                }}
              >
                {role === 'provider' ? <Briefcase size={14} /> : <Shield size={14} />}
                <span>{role === 'provider' ? 'Modo Proveedor' : 'Modo Cliente'}</span>
              </button>

              {/* Botón de Cuenta y Desconexión */}
              <div style={{ position: 'relative' }}>
                <button 
                  className="btn-connect"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <Wallet size={16} />
                  <span>{truncateAddress(walletAddress)}</span>
                  <ChevronDown size={14} />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    width: 220,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    padding: 8,
                    zIndex: 1000,
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conectado como</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {role === 'provider' ? '🩺 Prestador de Servicios' : '🛡️ Cliente / Paciente'}
                      </div>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        borderRadius: 8,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                      }}
                    >
                      Ir a mi Dashboard
                    </Link>

                    <button
                      onClick={() => {
                        updateRole(role === 'provider' ? 'customer' : 'provider');
                        setDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      Cambiar a {role === 'provider' ? 'Vista Cliente' : 'Vista Proveedor'}
                    </button>

                    <button
                      onClick={() => {
                        signOut();
                        setDropdownOpen(false);
                        navigate('/');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(245, 66, 66, 0.08)',
                        color: '#f54242',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginTop: 4,
                      }}
                    >
                      <LogOut size={14} />
                      Desconectar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button className="btn-connect" onClick={() => navigate('/wallet-connect')}>
              <Wallet size={16} />
              Conectar Billetera
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
                else navigate('/dashboard');
              }}
              style={{ marginTop: 16 }}
            >
              <Wallet size={16} />
              {walletAddress ? `Dashboard (${truncateAddress(walletAddress)})` : 'Conectar Billetera'}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
