import { Link } from 'react-router-dom';
import Icon from './Icon';

const LEGAL_TABS = [
  { to: '/terms', label: 'Terms & Conditions', icon: 'case' },
  { to: '/privacy', label: 'Privacy Policy', icon: 'settings' },
  { to: '/about', label: 'About Us', icon: 'court' },
  { to: '/contact', label: 'Contact Us', icon: 'phone' },
  { to: '/refund-policy', label: 'Refund Policy', icon: 'billing' },
];

export default function LegalNavTabs({ activePath }) {
  return (
    <div className="legal-tab-switch" role="tablist" aria-label="Legal and Company Hub Navigation">
      {LEGAL_TABS.map((tab) => {
        const isActive = activePath === tab.to || (tab.to === '/refund-policy' && activePath === '/refunds');
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`legal-tab-btn${isActive ? ' is-active' : ''}`}
            role="tab"
            aria-selected={isActive}
          >
            <Icon name={tab.icon} style={{ width: 15, height: 15 }} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
