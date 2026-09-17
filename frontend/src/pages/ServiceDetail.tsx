import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Shield, CheckCircle, 
  Lock, ArrowLeft, Users
} from 'lucide-react';
import { categories } from '../config/config';

const services: Record<number, any> = {
  1: {
    id: 1,
    title: 'Premium Auto Maintenance',
    description: 'Comprehensive vehicle maintenance with guaranteed quality. Our certified technicians ensure your vehicle receives the highest standard of care.',
    fullDescription: [
      'Multi-point vehicle inspection covering engine, brakes, transmission, and electrical systems',
      'Premium synthetic oil change with OEM-approved filters',
      'Tire rotation and pressure balancing',
      'Fluid level checks and top-offs',
      'Battery health assessment',
      'Digital vehicle health report',
    ],
    category: 'mechanic',
    provider: 'AutoCare Pro',
    price: '29',
    duration: '30 Days',
    guarantees: [
      'Certified ASE technicians',
      'Genuine OEM parts only',
      'Free re-service within 7 days',
      'No hidden charges',
    ],
    claimsHistory: { total: 142, resolved: 138, pending: 4 },
  },
  2: {
    id: 2,
    title: 'Telehealth Consultation',
    description: 'Access to board-certified physicians for virtual consultations. Get quality healthcare from the comfort of your home.',
    fullDescription: [
      'Unlimited video consultations with licensed physicians',
      '24/7 availability for urgent care needs',
      'Digital prescriptions sent directly to your pharmacy',
      'Follow-up consultations included',
      'Medical records management',
      'Specialist referrals when needed',
    ],
    category: 'doctor',
    provider: 'MediCare Plus',
    price: '49',
    duration: '30 Days',
    guarantees: [
      'Board-certified physicians',
      'HIPAA compliant platform',
      '15-minute response guarantee',
      'Full refund if unsatisfied',
    ],
    claimsHistory: { total: 89, resolved: 87, pending: 2 },
  },
};

export default function ServiceDetail() {
  const { id } = useParams();
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const service = services[Number(id)] || {
    id: Number(id) || 1,
    title: 'Premium Service',
    description: 'High-quality service with blockchain-backed guarantees.',
    fullDescription: ['Professional service delivery', 'Quality assurance', '24/7 support'],
    category: 'mechanic',
    provider: 'Service Provider',
    price: '49',
    duration: '30 Days',
    guarantees: ['Guaranteed quality', 'Full support', 'Refund policy'],
    claimsHistory: { total: 50, resolved: 48, pending: 2 },
  };

  const categoryData = categories[service.category as keyof typeof categories];

  const handleSubscribe = async () => {
    setSubscribing(true);
    await new Promise(r => setTimeout(r, 2000));
    setSubscribed(true);
    setSubscribing(false);
  };

  if (subscribed) {
    return (
      <main>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 24,
          background: 'var(--bg-secondary)',
        }}>
          <div className="auth-card" style={{ maxWidth: 500 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: 'rgba(0, 214, 114, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <CheckCircle size={36} color="#00b35e" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>
              Subscription Active!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              Your blockchain-backed guarantee for <strong>{service.title}</strong> is now active. 
              You can manage it from your dashboard.
            </p>
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
            }}>
              <Link to="/dashboard" className="btn-primary">
                View Dashboard
              </Link>
              <Link to="/services" className="btn-secondary">
                Browse More
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <section className="services-section">
        <div className="section-container">
          <Link 
            to="/services" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              marginBottom: 32,
              fontSize: '0.9375rem',
            }}
          >
            <ArrowLeft size={18} /> Back to Services
          </Link>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 380px', 
            gap: 48,
            alignItems: 'start',
          }}>
            {/* Main Content */}
            <div>
              <div 
                className="service-category-badge"
                style={{
                  background: categoryData?.bgColor || 'var(--bg-secondary)',
                  color: categoryData?.color || 'var(--text-primary)',
                  marginBottom: 16,
                }}
              >
                {categoryData && <categoryData.icon size={14} />}
                {categoryData?.name || service.category}
              </div>

              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: 800, 
                marginBottom: 16,
                color: 'var(--text-primary)',
              }}>
                {service.title}
              </h1>

              <p style={{ 
                color: 'var(--text-secondary)', 
                lineHeight: 1.7,
                marginBottom: 32,
                fontSize: '1.0625rem',
              }}>
                {service.description}
              </p>

              <div style={{ marginBottom: 32 }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 700, 
                  marginBottom: 16,
                  color: 'var(--text-primary)',
                }}>
                  What's Included
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {service.fullDescription.map((item: string, i: number) => (
                    <li key={i} style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 0',
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9375rem',
                    }}>
                      <CheckCircle size={18} color="#00b35e" style={{ flexShrink: 0, marginTop: 2 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 700, 
                  marginBottom: 16,
                  color: 'var(--text-primary)',
                }}>
                  Provider Guarantees
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 12,
                }}>
                  {service.guarantees.map((guarantee: string, i: number) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '14px 16px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 10,
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                    }}>
                      <Shield size={16} color="var(--primary)" />
                      {guarantee}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{
              position: 'sticky',
              top: 96,
              padding: 28,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 16,
            }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Monthly Price
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ${service.price}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Coverage Period
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {service.duration}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Provider
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}>
                  <Users size={16} />
                  {service.provider}
                </div>
              </div>

              <button 
                className="btn-primary" 
                style={{ width: '100%', marginBottom: 16 }}
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? (
                  <>
                    <div className="animate-spin" style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Subscribe Now
                  </>
                )}
              </button>

              <p style={{ 
                fontSize: '0.8125rem', 
                color: 'var(--text-muted)', 
                textAlign: 'center',
                lineHeight: 1.5,
              }}>
                Powered by Unlock Protocol on Polygon. Cancel anytime.
              </p>

              <div style={{
                marginTop: 24,
                padding: 16,
                background: 'var(--bg-secondary)',
                borderRadius: 10,
              }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 8 }}>
                  Claims History
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
                }}>
                  <span>Total Claims: {service.claimsHistory.total}</span>
                  <span style={{ color: '#00b35e' }}>
                    Resolved: {service.claimsHistory.resolved}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
