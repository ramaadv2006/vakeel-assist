import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, Sparkles, Shield, Zap, ArrowLeft, 
  HelpCircle, Scale, FileText, CheckCircle2, Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';
import { startRazorpayCheckout } from '../utils/razorpay';
import { useFlash } from '../context/FlashContext';

export default function Pricing() {
  const { plan: userPlan, isPro, refreshPlan, openUpgradeModal } = usePlan();
  const { advocate } = useAuth();
  const flash = useFlash();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    api.get('/payments/plans')
      .then((res) => {
        if (res?.plans) {
          setPlans(res.plans);
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic plans, using defaults:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleProUpgrade = () => {
    if (!advocate) {
      window.location.href = '/login?redirect=/pricing';
      return;
    }
    openUpgradeModal({
      title: 'Vakeel Assist Pro',
      sub: 'Complete trial advocacy & legal drafting suite',
    });
  };

  const proPrice = plans.find((p) => p.slug === 'pro')?.price ?? 99;

  return (
    <div style={{ minHeight: '90vh', padding: '36px 20px 60px', maxWidth: 1140, margin: '0 auto' }}>
      {/* Top Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link 
          to="/" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6, 
            color: 'var(--text-muted, #94a3b8)', 
            textDecoration: 'none',
            fontSize: 14.5,
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> <span>Back to Dashboard</span>
        </Link>
        <span style={{ color: 'var(--border, #334155)' }}>•</span>
        <span style={{ fontSize: 14.5, color: '#d4af37', fontWeight: 600 }}>Subscription Plans</span>
      </div>

      {/* Header Eyebrow & Hero Title */}
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
        <div 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6, 
            background: 'rgba(212, 175, 55, 0.12)', 
            border: '1px solid rgba(212, 175, 55, 0.3)',
            padding: '5px 14px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 700,
            color: '#d4af37',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            marginBottom: 14,
          }}
        >
          <Sparkles size={14} /> Transparent Advocate Pricing
        </div>
        <h1 
          style={{ 
            fontSize: 'clamp(28px, 4vw, 38px)', 
            fontWeight: 800, 
            fontFamily: "'Lora', serif",
            color: 'var(--text-dark, #0b1526)',
            margin: '0 0 14px',
            lineHeight: 1.2,
          }}
        >
          Empowering Advocates with Modern Legal Intelligence
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted, #64748b)', lineHeight: 1.6, margin: 0 }}>
          Choose the plan that matches your practice. All core case diary and free draft features remain unrestricted.
        </p>
      </div>

      {/* Two Comparison Cards */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: 28,
          alignItems: 'stretch',
          maxWidth: 960,
          margin: '0 auto 48px',
        }}
      >
        {/* Plan 1: FREE */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          style={{
            background: 'var(--bg-card, #ffffff)',
            borderRadius: 20,
            border: '1px solid var(--border-card, #e2e8f0)',
            boxShadow: 'var(--shadow-sm, 0 4px 16px rgba(0,0,0,0.04))',
            padding: '36px 30px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-dark, #0b1526)' }}>Free Plan</h3>
              {!isPro && (
                <span 
                  style={{
                    background: 'var(--bg-app, #f1f5f9)',
                    color: 'var(--text-muted, #64748b)',
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  Current Plan
                </span>
              )}
            </div>

            <p style={{ fontSize: 14.5, color: 'var(--text-muted, #64748b)', margin: '0 0 24px', lineHeight: 1.5 }}>
              Essential day-to-day court tracking, client directory, and standard petitions for practicing advocates.
            </p>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border, #e2e8f0)' }}>
              <span style={{ fontSize: 38, fontWeight: 800, color: 'var(--text-dark, #0b1526)' }}>₹0</span>
              <span style={{ fontSize: 14, color: 'var(--text-muted, #64748b)' }}>/ forever free</span>
            </div>

            {/* Feature List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-dark, #334155)' }}>
                <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <span>Active Case & Hearing Date Diary</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-dark, #334155)' }}>
                <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <span>10 Standard Court Petitions & Vakalats</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-dark, #334155)' }}>
                <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <span>Client Directory & Fee Ledger</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-dark, #334155)' }}>
                <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <span>eCourts Case Search & Live Updates</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-dark, #334155)' }}>
                <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <span>Basic AI Legal Research Assistant</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-muted, #94a3b8)' }}>
                <Lock size={16} style={{ flexShrink: 0 }} />
                <span>Bail Application (BNSS 480)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-muted, #94a3b8)' }}>
                <Lock size={16} style={{ flexShrink: 0 }} />
                <span>Suretyship Form 46 (Solvency)</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled
            style={{
              width: '100%',
              padding: '13px',
              background: 'var(--bg-app, #f1f5f9)',
              border: '1px solid var(--border-card, #e2e8f0)',
              borderRadius: 12,
              color: 'var(--text-muted, #64748b)',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'default',
            }}
          >
            {!isPro ? 'Your Active Plan' : 'Free Tier'}
          </button>
        </motion.div>

        {/* Plan 2: PRO (Highlighted) */}
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ duration: 0.2 }}
          style={{
            background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(11, 21, 38, 0.02) 100%), var(--bg-card, #ffffff)',
            borderRadius: 20,
            border: '2px solid #d4af37',
            boxShadow: '0 16px 40px -8px rgba(212, 175, 55, 0.25)',
            padding: '36px 30px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {/* Top Gold Pill */}
          <div 
            style={{
              position: 'absolute',
              top: -14,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #d4af37 0%, #b8935e 100%)',
              color: '#0b1526',
              padding: '4px 16px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.35)',
            }}
          >
            Recommended
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 }}>
              <h3 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text-dark, #0b1526)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Pro Plan</span>
                <Sparkles size={18} color="#d4af37" />
              </h3>
              {isPro && (
                <span 
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 12.5,
                    fontWeight: 700,
                  }}
                >
                  ✓ Active Subscribed
                </span>
              )}
            </div>

            <p style={{ fontSize: 14.5, color: 'var(--text-muted, #64748b)', margin: '0 0 24px', lineHeight: 1.5 }}>
              Comprehensive trial litigation suite with statutory bail pleadings, solvency forms, and AI intelligence.
            </p>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(212, 175, 55, 0.25)' }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: 'var(--text-dark, #0b1526)' }}>₹{proPrice}</span>
              <span style={{ fontSize: 14.5, color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>/ month</span>
            </div>

            {/* Feature List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-dark, #0b1526)', fontWeight: 600 }}>
                <CheckCircle2 size={18} color="#d4af37" style={{ flexShrink: 0 }} />
                <span>Everything in Free Plan</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-dark, #0b1526)', fontWeight: 600 }}>
                <CheckCircle2 size={18} color="#d4af37" style={{ flexShrink: 0 }} />
                <span>Bail Application (BNSS Sec 480 / CrPC)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-dark, #0b1526)', fontWeight: 600 }}>
                <CheckCircle2 size={18} color="#d4af37" style={{ flexShrink: 0 }} />
                <span>Suretyship Form 46 (Solvency & Rule 14)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-dark, #0b1526)' }}>
                <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <span>Automated Folded Docket / Backing Sheets</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-dark, #0b1526)' }}>
                <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <span>Advanced AI Legal Case Analysis (PDF / DOCX)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-dark, #0b1526)' }}>
                <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <span>Unlimited Custom Legal Templates</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--text-dark, #0b1526)' }}>
                <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <span>Priority Advocate Support & Fast Delivery</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleProUpgrade}
            style={{
              width: '100%',
              padding: '14px',
              background: isPro 
                ? 'var(--bg-app, #f1f5f9)' 
                : 'linear-gradient(135deg, #d4af37 0%, #b8935e 100%)',
              border: isPro ? '1px solid var(--border-card, #e2e8f0)' : 'none',
              borderRadius: 12,
              color: isPro ? 'var(--text-muted, #64748b)' : '#0b1526',
              fontWeight: 800,
              fontSize: 15.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: isPro ? 'default' : 'pointer',
              boxShadow: isPro ? 'none' : '0 4px 18px rgba(212, 175, 55, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            {isPro ? (
              <span>Your Active Plan</span>
            ) : (
              <>
                <Zap size={17} />
                <span>Upgrade to Pro — ₹{proPrice}/mo</span>
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* Security and Guarantee Banner */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          flexWrap: 'wrap',
          color: 'var(--text-muted, #64748b)',
          fontSize: 14,
          textAlign: 'center',
          paddingTop: 16,
          borderTop: '1px solid var(--border-card, #e2e8f0)',
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Shield size={16} color="#10b981" /> 256-Bit Encrypted Razorpay Checkout
        </span>
        <span>•</span>
        <span>Cancel Subscription Anytime</span>
        <span>•</span>
        <span>Designed for Indian Courts</span>
      </div>
    </div>
  );
}
