import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, ShieldCheck, Zap, X, 
  Loader2, AlertCircle, ArrowRight, Lock, FileText, Scale
} from 'lucide-react';
import { usePlan } from '../context/PlanContext';
import { startRazorpayCheckout } from '../utils/razorpay';
import { useFlash } from '../context/FlashContext';

export default function UpgradeModal() {
  const { upgradeModalOpen, closeUpgradeModal, modalContext, refreshPlan, plan } = usePlan();
  const flash = useFlash();
  const [checkoutState, setCheckoutState] = useState('idle'); // idle | loading | checkout_open | verifying | success | failed | cancelled
  const [errorMessage, setErrorMessage] = useState('');

  if (!upgradeModalOpen) return null;

  // Custom draft context if opened from a specific draft card
  const draftTitle = modalContext?.title || modalContext?.name || null;
  const draftDescription = modalContext?.description || modalContext?.sub || null;

  const handleUpgradeClick = async () => {
    setErrorMessage('');
    await startRazorpayCheckout({
      planSlug: 'pro',
      onStateChange: (st) => {
        setCheckoutState(st);
      },
      onSuccess: async (verifyRes) => {
        setCheckoutState('success');
        await refreshPlan();
        if (flash?.addFlash) {
          flash.addFlash('success', '🎉 Welcome to Vakeel Assist Pro! All premium drafting features are now unlocked.');
        }
        setTimeout(() => {
          closeUpgradeModal();
          setCheckoutState('idle');
        }, 1800);
      },
      onError: (err) => {
        setCheckoutState('failed');
        setErrorMessage(err.message || 'Payment could not be completed. Please try again.');
      },
      onDismiss: () => {
        setCheckoutState('idle');
      },
    });
  };

  const isButtonDisabled = checkoutState === 'loading' || checkoutState === 'verifying' || checkoutState === 'checkout_open';

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(11, 21, 38, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isButtonDisabled) {
            closeUpgradeModal();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'linear-gradient(180deg, #111e33 0%, #0c1626 100%)',
            borderRadius: 20,
            border: '1px solid rgba(212, 175, 55, 0.35)',
            boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.75), 0 0 36px rgba(212, 175, 55, 0.15)',
            maxWidth: 540,
            width: '100%',
            overflow: 'hidden',
            position: 'relative',
            color: '#f1f5f9',
          }}
        >
          {/* Top Decorative Gold Sheen */}
          <div 
            style={{
              background: 'linear-gradient(90deg, #b8935e 0%, #f5d77f 50%, #b8935e 100%)',
              height: 5,
              width: '100%',
            }}
          />

          {/* Close Button */}
          <button
            onClick={closeUpgradeModal}
            disabled={isButtonDisabled}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
            title="Close"
          >
            <X size={17} />
          </button>

          <div style={{ padding: '26px 28px 28px' }}>
            {/* Header Badge & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(212, 175, 55, 0.16)',
                  border: '1px solid rgba(212, 175, 55, 0.45)',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#f3cf65',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                <Sparkles size={13} /> Pro Feature
              </span>
            </div>

            <h2 
              style={{ 
                fontSize: 23, 
                fontWeight: 800, 
                margin: '0 0 8px', 
                fontFamily: "'Lora', serif",
                color: '#ffffff',
                lineHeight: 1.28,
              }}
            >
              {draftTitle ? `Unlock ${draftTitle}` : 'Unlock Advanced Legal Drafting'}
            </h2>

            <p style={{ fontSize: 14.5, color: '#94a3b8', lineHeight: 1.55, margin: '0 0 20px' }}>
              {draftDescription
                ? `${draftDescription}. Upgrade to Vakeel Assist Pro to access this verified court draft and full trial litigation suite.`
                : 'Upgrade to Vakeel Assist Pro to access specialized court petitions, statutory bail pleadings, and advanced AI features.'}
            </p>

            {/* Feature Highlights Grid */}
            <div 
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '16px 18px',
                marginBottom: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle2 size={17} color="#f3cf65" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.45 }}>
                  <strong style={{ color: '#ffffff', fontWeight: 600 }}>Bail Petitions under BNSS Sec 480:</strong> Complete statutory grounds, non-bailable pleadings, and formatted prayers.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle2 size={17} color="#f3cf65" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.45 }}>
                  <strong style={{ color: '#ffffff', fontWeight: 600 }}>Suretyship Form 46:</strong> High Court Rule 14 solvency statements, property valuation disclosures, and verification.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle2 size={17} color="#f3cf65" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.45 }}>
                  <strong style={{ color: '#ffffff', fontWeight: 600 }}>Automated Court Docketing:</strong> Clean folded backing sheets formatted for direct court filing.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle2 size={17} color="#f3cf65" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.45 }}>
                  <strong style={{ color: '#ffffff', fontWeight: 600 }}>Advanced AI Legal Intelligence:</strong> Case analysis, document summarization, and higher request limits.
                </div>
              </div>
            </div>

            {/* Price & Billing Interval Box */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.14) 0%, rgba(184, 147, 94, 0.05) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 11.5, textTransform: 'uppercase', color: '#f3cf65', fontWeight: 700, letterSpacing: '0.6px' }}>
                  Subscription Price
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 2 }}>
                  ₹499 <span style={{ fontSize: 13.5, color: '#94a3b8', fontWeight: 500 }}>/ month</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 12.5, color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  <ShieldCheck size={15} /> Instant Access
                </span>
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>Cancel anytime</div>
              </div>
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(239, 68, 68, 0.16)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13.5,
                  color: '#fca5a5',
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                type="button"
                onClick={closeUpgradeModal}
                disabled={isButtonDisabled}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: 10,
                  color: '#cbd5e1',
                  fontWeight: 600,
                  fontSize: 14.5,
                  cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#cbd5e1'; }}
              >
                Maybe Later
              </button>

              <button
                type="button"
                onClick={handleUpgradeClick}
                disabled={isButtonDisabled}
                style={{
                  flex: 2,
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #f3cf65 0%, #c9983e 100%)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#070f1e',
                  fontWeight: 800,
                  fontSize: 15,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 18px rgba(212, 175, 55, 0.4)',
                  opacity: isButtonDisabled ? 0.8 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { if (!isButtonDisabled) e.currentTarget.style.filter = 'brightness(1.07)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                {checkoutState === 'loading' ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Preparing Order…</span>
                  </>
                ) : checkoutState === 'verifying' ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Verifying Payment…</span>
                  </>
                ) : checkoutState === 'success' ? (
                  <>
                    <CheckCircle2 size={16} color="#070f1e" />
                    <span>Pro Unlocked!</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} fill="#070f1e" />
                    <span>Upgrade to Pro — ₹499</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
