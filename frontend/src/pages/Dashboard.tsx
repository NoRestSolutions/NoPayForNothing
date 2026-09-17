import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, FileText, Clock, 
  CheckCircle, TrendingUp,
  Wallet, ExternalLink, AlertCircle
} from 'lucide-react';

const mockContracts = [
  {
    id: 1,
    title: 'Premium Auto Maintenance',
    provider: 'AutoCare Pro',
    status: 'active',
    price: '29',
    startDate: '2026-01-15',
    endDate: '2026-02-15',
    network: 'Polygon',
    lockAddress: '0x1234...5678',
  },
  {
    id: 2,
    title: 'Telehealth Consultation',
    provider: 'MediCare Plus',
    status: 'active',
    price: '49',
    startDate: '2026-01-10',
    endDate: '2026-02-10',
    network: 'Polygon',
    lockAddress: '0x9876...5432',
  },
  {
    id: 3,
    title: 'Deep Clean Service',
    provider: 'CleanPro',
    status: 'expired',
    price: '39',
    startDate: '2025-12-01',
    endDate: '2025-12-31',
    network: 'Polygon',
    lockAddress: '0x1111...2222',
  },
];

const mockClaims = [
  {
    id: 1,
    contractTitle: 'Premium Auto Maintenance',
    provider: 'AutoCare Pro',
    status: 'resolved',
    amount: '150',
    date: '2026-01-25',
    reason: 'Service not completed as described',
  },
  {
    id: 2,
    contractTitle: 'Telehealth Consultation',
    provider: 'MediCare Plus',
    status: 'pending',
    amount: '75',
    date: '2026-01-28',
    reason: 'Follow-up consultation not provided',
  },
];

export default function Dashboard() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'contracts' | 'claims'>('contracts');
  const [stats] = useState({
    activeContracts: 2,
    totalSpent: '78',
    pendingClaims: 1,
  });

  useEffect(() => {
    const stored = localStorage.getItem('wallet_address');
    if (stored) setWalletAddress(stored);
  }, []);

  if (!walletAddress) {
    return (
      <main style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
      }}>
        <div className="auth-card">
          <div className="auth-logo">
            <Wallet size={28} color="white" />
          </div>
          <h2 className="auth-title">Connect Your Wallet</h2>
          <p className="auth-subtitle">
            Please connect your wallet to access the dashboard.
          </p>
          <Link to="/wallet-connect" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Connect Wallet
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="dashboard-header">
        <div className="section-container">
          <h1 className="dashboard-title">Your Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage your subscriptions and view claims history
          </p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="stats-row">
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(0, 214, 114, 0.1)', color: '#00b35e' }}>
              <Shield size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Active Contracts</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.activeContracts}</div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(105, 54, 255, 0.1)', color: 'var(--primary)' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Total Spent</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${stats.totalSpent}</div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(245, 166, 35, 0.1)', color: '#f5a623' }}>
              <FileText size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Pending Claims</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.pendingClaims}</div>
            </div>
          </div>
        </div>

        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'contracts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contracts')}
          >
            My Contracts
          </button>
          <button 
            className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
            onClick={() => setActiveTab('claims')}
          >
            Claims History
          </button>
        </div>

        {activeTab === 'contracts' && (
          <div>
            {mockContracts.map((contract) => (
              <div key={contract.id} className="contract-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>
                      {contract.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {contract.provider}
                    </p>
                  </div>
                  <span className={`status-badge status-${contract.status}`}>
                    {contract.status === 'active' && <CheckCircle size={12} />}
                    {contract.status === 'expired' && <AlertCircle size={12} />}
                    {contract.status}
                  </span>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: 16,
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price</div>
                    <div style={{ fontWeight: 600 }}>${contract.price}/mo</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Start Date</div>
                    <div style={{ fontWeight: 600 }}>{contract.startDate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>End Date</div>
                    <div style={{ fontWeight: 600 }}>{contract.endDate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Network</div>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {contract.network}
                      <ExternalLink size={12} color="var(--text-muted)" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'claims' && (
          <div>
            {mockClaims.map((claim) => (
              <div key={claim.id} className="contract-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>
                      {claim.contractTitle}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {claim.reason}
                    </p>
                  </div>
                  <span className={`status-badge status-${claim.status}`}>
                    {claim.status === 'resolved' && <CheckCircle size={12} />}
                    {claim.status === 'pending' && <Clock size={12} />}
                    {claim.status}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: 24,
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount</div>
                    <div style={{ fontWeight: 600 }}>${claim.amount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date Filed</div>
                    <div style={{ fontWeight: 600 }}>{claim.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
