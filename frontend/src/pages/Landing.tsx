import { Link } from 'react-router-dom';
import { 
  Shield, Zap, ArrowRight, 
  Link2, CreditCard, FileCheck, Clock,
  AlertTriangle, CheckCircle, Briefcase
} from 'lucide-react';
import { AnimatedCounter } from '../components/ui/AnimatedComponents';

const features = [
  {
    icon: Link2,
    title: 'Blockchain-Backed',
    description: 'Every guarantee is recorded on Polygon, providing immutable proof of service commitments.',
  },
  {
    icon: CreditCard,
    title: 'Recurring Subscriptions',
    description: 'Automated payments via Unlock Protocol locks. No missed renewals.',
  },
  {
    icon: Shield,
    title: 'Trustless Guarantees',
    description: 'Smart contracts enforce guarantees without relying on intermediaries.',
  },
  {
    icon: FileCheck,
    title: 'Claims System',
    description: 'File claims directly through the platform. Disputes resolved fairly on-chain.',
  },
  {
    icon: Clock,
    title: 'Time-Based Access',
    description: 'Subscriptions with built-in expirations and renewal handling.',
  },
  {
    icon: Zap,
    title: 'Instant Activation',
    description: 'Start using services immediately after connecting your wallet.',
  },
];

const problems = [
  {
    icon: AlertTriangle,
    text: "You've paid for a service but the provider doesn't honor their guarantees — and you have no way to enforce them.",
  },
  {
    icon: AlertTriangle,
    text: "Traditional platforms charge high fees and offer little transparency into how your money is being used.",
  },
  {
    icon: AlertTriangle,
    text: "There's no reliable way to verify if a service provider has a track record of fulfilling their promises.",
  },
];

const solutions = [
  {
    icon: CheckCircle,
    title: 'Immutable Guarantees',
    description: 'Service guarantees are recorded on-chain and cannot be altered or deleted by either party.',
  },
  {
    icon: CheckCircle,
    title: 'Automated Enforcement',
    description: 'Smart contracts automatically handle claims and payouts when conditions are met.',
  },
  {
    icon: CheckCircle,
    title: 'Transparent History',
    description: 'View a provider\'s complete history of guarantees and claims before subscribing.',
  },
];

const testimonials = [
  {
    text: "NoPayForNothing changed how we offer service guarantees. Our customers trust us more because everything is transparent on-chain.",
    name: "Alex Thompson",
    company: "AutoCare Pro",
    role: "CEO",
  },
  {
    text: "The blockchain-backed guarantees give our clients peace of mind. We've seen a 40% increase in subscriptions since switching.",
    name: "Sarah Chen",
    company: "MediCare Plus",
    role: "Founder",
  },
  {
    text: "Finally, a platform that makes service guarantees actually mean something. The claims process is fair and transparent.",
    name: "Michael Rivera",
    company: "HomeShield",
    role: "CTO",
  },
];

export default function Landing() {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Zap size={14} /> Built on Polygon
            </div>
            <h1 className="hero-title">
              Service guarantees you can <span className="highlight">actually trust</span>
            </h1>
            <p className="hero-subtitle">
              Subscribe to services with blockchain-backed guarantees. No hidden fees, 
              no broken promises — just transparent, enforceable commitments.
            </p>
            <div className="hero-buttons">
              <Link to="/services" className="btn-primary">
                Explore Services <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="btn-secondary">
                Learn More
              </a>
            </div>
          </div>
          <div className="hero-illustration">
            <div className="hero-image-placeholder">
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
                padding: 40,
              }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: 'rgba(105, 54, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Shield size={40} color="var(--primary)" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>
                    Guarantee #4829
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    AutoCare Pro — Oil Change Service
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    padding: '8px 16px',
                    background: 'rgba(0, 214, 114, 0.1)',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#00b35e',
                  }}>
                    Active
                  </div>
                  <div style={{
                    padding: '8px 16px',
                    background: 'rgba(105, 54, 255, 0.1)',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--primary)',
                  }}>
                    30 Days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="logos-section">
        <div className="logos-container">
          <div className="logos-title">Trusted by innovative service providers</div>
          <div className="logos-grid">
            <span className="logo-item">AutoCare Pro</span>
            <span className="logo-item">MediCare Plus</span>
            <span className="logo-item">HomeShield</span>
            <span className="logo-item">CleanPro</span>
            <span className="logo-item">TechFix</span>
            <span className="logo-item">LegalShield</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Everything you need for service guarantees</h2>
            <p className="section-subtitle">
              Built specifically for service providers who want to offer transparent, 
              blockchain-backed guarantees to their customers.
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card">
                <div className="feature-icon">
                  <feature.icon size={24} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section" id="problem">
        <div className="section-container">
          <div className="problem-grid">
            <div className="problem-content">
              <span className="section-badge">The Problem</span>
              <h2 className="section-title" style={{ textAlign: 'left' }}>
                Service guarantees are often meaningless
              </h2>
              <p className="section-subtitle" style={{ textAlign: 'left' }}>
                Traditional platforms offer no real enforcement mechanism. 
                When something goes wrong, customers are left without recourse.
              </p>
            </div>
            <div className="problem-cards">
              {problems.map((problem, i) => (
                <div key={i} className="problem-card">
                  <div className="problem-icon">
                    <problem.icon size={24} />
                  </div>
                  <p className="problem-text">{problem.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="solution-section" id="solution">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">The Solution</span>
            <h2 className="section-title">Blockchain makes guarantees enforceable</h2>
            <p className="section-subtitle">
              NoPayForNothing uses smart contracts to create guarantees that 
              cannot be broken — because they're enforced by code, not trust.
            </p>
          </div>
          <div className="solution-grid">
            {solutions.map((solution) => (
              <div key={solution.title} className="solution-card">
                <div className="solution-icon">
                  <solution.icon size={28} />
                </div>
                <h3 className="solution-title">{solution.title}</h3>
                <p className="solution-description">{solution.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-grid">
            <AnimatedCounter value={5000} suffix="+" label="Guarantees Created" />
            <AnimatedCounter value={98} suffix="%" label="Fulfillment Rate" />
            <AnimatedCounter value={250} prefix="$" suffix="K+" label="Total Value Secured" />
            <AnimatedCounter value={150} suffix="+" label="Service Providers" />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Testimonials</span>
            <h2 className="section-title">Trusted by service providers</h2>
            <p className="section-subtitle">
              See how businesses are using NoPayForNothing to build trust with their customers.
            </p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="testimonial-card">
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    <Briefcase size={20} color="var(--text-muted)" />
                  </div>
                  <div>
                    <div className="testimonial-name">{testimonial.name}</div>
                    <div className="testimonial-company">{testimonial.company} · {testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-card">
          <h2 className="cta-title">Ready to offer guarantees that matter?</h2>
          <p className="cta-subtitle">
            Start building trust with your customers through blockchain-backed service guarantees.
          </p>
          <div className="cta-buttons">
            <Link to="/services" className="btn-primary">
              Get Started <ArrowRight size={18} />
            </Link>
            <a href="https://docs.unlock-protocol.com" className="btn-secondary" target="_blank" rel="noopener noreferrer">
              Read Documentation
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
