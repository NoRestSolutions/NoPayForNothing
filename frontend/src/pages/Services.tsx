import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users } from 'lucide-react';
import { categories } from '../config/config';

const services = [
  {
    id: 1,
    title: 'Premium Auto Maintenance',
    description: 'Comprehensive vehicle maintenance with guaranteed quality. Covers oil changes, filter replacements, and multi-point inspections.',
    category: 'mechanic',
    provider: 'AutoCare Pro',
    price: '29',
    duration: '30 Days',
    icon: categories.mechanic.icon,
    color: categories.mechanic.color,
    bgColor: categories.mechanic.bgColor,
  },
  {
    id: 2,
    title: 'Telehealth Consultation',
    description: 'Access to board-certified physicians for virtual consultations. Includes follow-up support and prescription services.',
    category: 'doctor',
    provider: 'MediCare Plus',
    price: '49',
    duration: '30 Days',
    icon: categories.doctor.icon,
    color: categories.doctor.color,
    bgColor: categories.doctor.bgColor,
  },
  {
    id: 3,
    title: 'Deep Clean Service',
    description: 'Professional deep cleaning for homes and offices. Satisfaction guaranteed with free re-clean within 48 hours.',
    category: 'cleaner',
    provider: 'CleanPro',
    price: '39',
    duration: '30 Days',
    icon: categories.cleaner.icon,
    color: categories.cleaner.color,
    bgColor: categories.cleaner.bgColor,
  },
  {
    id: 4,
    title: 'Emergency Plumbing',
    description: '24/7 emergency plumbing services with guaranteed response times. All repairs backed by 90-day warranty.',
    category: 'plumber',
    provider: 'HomeShield',
    price: '59',
    duration: '30 Days',
    icon: categories.plumber.icon,
    color: categories.plumber.color,
    bgColor: categories.plumber.bgColor,
  },
  {
    id: 5,
    title: 'Electrical Safety Check',
    description: 'Complete electrical system inspection and safety certification. Includes detailed report and recommendations.',
    category: 'electrician',
    provider: 'PowerSafe',
    price: '79',
    duration: '60 Days',
    icon: categories.electrician.icon,
    color: categories.electrician.color,
    bgColor: categories.electrician.bgColor,
  },
  {
    id: 6,
    title: 'Tax Advisory Service',
    description: 'Professional tax consultation with guaranteed accuracy. Includes audit support and amendment assistance.',
    category: 'legal',
    provider: 'LegalShield',
    price: '99',
    duration: '90 Days',
    icon: categories.legal.icon,
    color: categories.legal.color,
    bgColor: categories.legal.bgColor,
  },
];

export default function Services() {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredServices = activeCategory === 'all' 
    ? services 
    : services.filter(s => s.category === activeCategory);

  return (
    <main>
      <section className="services-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Services</span>
            <h2 className="section-title">Browse available services</h2>
            <p className="section-subtitle">
              Find service providers with blockchain-backed guarantees
            </p>
          </div>

          <div className="services-header">
            <div className="filter-tabs">
              <button
                className={`filter-tab ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                All Services
              </button>
              {Object.entries(categories).map(([key, category]) => (
                <button
                  key={key}
                  className={`filter-tab ${activeCategory === key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(key)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="services-grid">
            {filteredServices.map((service) => (
              <Link 
                key={service.id} 
                to={`/services/${service.id}`}
                className="service-card"
              >
                <div 
                  className="service-category-badge"
                  style={{
                    background: service.bgColor,
                    color: service.color,
                  }}
                >
                  <service.icon size={14} />
                  {categories[service.category]?.name || service.category}
                </div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-pricing">
                  <div>
                    <div className="price-label">Monthly Price</div>
                    <div className="price-value">${service.price}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="coverage-label">Coverage Period</div>
                    <div className="coverage-value">{service.duration}</div>
                  </div>
                </div>
                <div className="service-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Shield size={14} /> Guaranteed
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={14} /> {service.provider}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              No services found in this category.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
