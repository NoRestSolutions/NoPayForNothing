import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Wallet, Shield, Briefcase, LogOut, ChevronDown, Lock, Sun, Moon, Globe } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const navigate = useNavigate();
  const { walletAddress, role, updateRole, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const navLinks = [
    { to: '/', label: t('header.inicio') },
    { to: '/services', label: t('header.servicios') },
    { to: '/dashboard', label: t('header.dashboard') },
    ...(role === 'provider' ? [{ to: '/dashboard/locks', label: t('header.locks'), icon: Lock }] : []),
  ];

  const switchLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        <Link to="/" className="header-logo" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Shield size={20} color="white" strokeWidth={2.5} />
          </div>
          <span>NoPayForNothing</span>
        </Link>

        <nav className="header-nav">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="nav-link"
            >
              {link.icon && <link.icon size={16} />}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {/* Language Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              <Globe size={14} />
              {i18n.language?.toUpperCase().slice(0, 2)}
            </button>
            {langOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                overflow: 'hidden',
                zIndex: 100,
                minWidth: 100,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}>
                <button
                  onClick={() => switchLanguage('es')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 14px',
                    textAlign: 'left',
                    border: 'none',
                    background: i18n.language?.startsWith('es') ? 'var(--bg-secondary)' : 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: i18n.language?.startsWith('es') ? 700 : 400,
                  }}
                >
                  🇪🇸 Español
                </button>
                <button
                  onClick={() => switchLanguage('en')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 14px',
                    textAlign: 'left',
                    border: 'none',
                    background: i18n.language?.startsWith('en') ? 'var(--bg-secondary)' : 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: i18n.language?.startsWith('en') ? 700 : 400,
                  }}
                >
                  🇺🇸 English
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {walletAddress ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="btn-connect"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--success)',
                }} />
                {truncateAddress(walletAddress)}
                <ChevronDown size={14} />
              </button>
              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  zIndex: 100,
                  minWidth: 200,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 2 }}>Conectado como</div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                    }}>
                      {role === 'provider' ? <Briefcase size={14} color="#16a34a" /> : <Shield size={14} color="#2563eb" />}
                      {role === 'provider' ? t('header.modoProveedor') : t('header.modoCliente')}
                    </div>
                  </div>
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
                      padding: '10px 14px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      textAlign: 'left',
                    }}
                  >
                    {role === 'provider' ? <Shield size={14} /> : <Briefcase size={14} />}
                    {role === 'provider' ? t('header.modoCliente') : t('header.modoProveedor')}
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
                      padding: '10px 14px',
                      border: 'none',
                      borderTop: '1px solid var(--border)',
                      background: 'transparent',
                      color: '#f54242',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      textAlign: 'left',
                    }}
                  >
                    <LogOut size={14} />
                    {t('header.cerrarSesion')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/wallet-connect')}
              className="btn-connect"
            >
              <Wallet size={16} />
              {t('header.conectar')}
            </button>
          )}

          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="mobile-nav-link"
              onClick={() => setMenuOpen(false)}
            >
              {link.icon && <link.icon size={18} />}
              {link.label}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
            <button
              onClick={() => { switchLanguage(i18n.language?.startsWith('es') ? 'en' : 'es'); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              <Globe size={16} />
              {i18n.language?.startsWith('es') ? 'English' : 'Español'}
            </button>
            <button
              onClick={toggleTheme}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
          {!walletAddress && (
            <div style={{ padding: '0 16px 12px' }}>
              <button
                onClick={() => { navigate('/wallet-connect'); setMenuOpen(false); }}
                className="btn-connect"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Wallet size={16} />
                {t('header.conectar')}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
