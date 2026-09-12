import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Globe, Check, Sparkles } from 'lucide-react';
import Icon from './Icon';

export function buildWhatsAppMessage(caseData, lang = 'en') {
  if (lang === 'ta') {
    let msg = `மதிப்பிற்குரிய வாடிக்கையாளருக்கு,\n\n`;
    msg += `உங்கள் வழக்கு தொடர்பான அடுத்த விசாரணை விவரங்கள்:\n\n`;
    msg += `⚖️ வழக்கு எண்: ${caseData.case_number || '–'}\n`;
    msg += `🏛️ நீதிமன்றம்: ${caseData.court_name || '–'}\n`;
    if (caseData.court_hall) {
      msg += `🏛️ நீதிமன்ற அறை: ${caseData.court_hall}\n`;
    }
    if (caseData.item_number) {
      msg += `🔢 பட்டியல் எண் (Item No): ${caseData.item_number}\n`;
    }
    msg += `📅 அடுத்த விசாரணை தேதி: ${caseData.next_hearing_date || '–'}\n`;
    if (caseData.case_stage) {
      msg += `📌 வழக்கின் நிலை: ${caseData.case_stage}\n`;
    }
    msg += `\nதயவுசெய்து குறிப்பிட்ட தேதியில் நீதிமன்றத்தில் ஆஜராகவும்.\n\n`;
    msg += `நன்றி,\nAdvo Buddy\nஉங்கள் வழக்கின் அடுத்த தேதியை நினைவூட்டும் உங்கள் சட்ட நண்பன்.`;
    return msg;
  }

  // Default English
  let message = `Respected Client, \n\nThis is to inform you that your case details are as follows:\n`;
  message += `- Case Number: ${caseData.case_number || '–'}\n`;
  message += `- Court: ${caseData.court_name || '–'}\n`;
  if (caseData.court_hall) message += `- Court Hall: ${caseData.court_hall}\n`;
  if (caseData.item_number) message += `- Item Number: ${caseData.item_number}\n`;
  if (caseData.judge_name) message += `- Judge: ${caseData.judge_name}\n`;
  message += `- Next Hearing Date: ${caseData.next_hearing_date || '–'}\n`;
  if (caseData.case_stage) message += `- Case Stage: ${caseData.case_stage}\n\n`;
  message += `Please be present.\nRegards,\n(Sent via Advo Buddy)`;
  return message;
}

export function openWhatsAppWithLanguage(caseData, lang = 'en') {
  const phone = caseData.client_phone || '';
  if (!phone) {
    alert("No client phone number listed for this case. Please add a phone number via 'Edit'.");
    return;
  }
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

  const message = buildWhatsAppMessage(caseData, lang);
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
}

export default function WhatsAppLanguageModal({ isOpen, onClose, caseData }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !caseData) return null;

  const handleSelectLang = (lang) => {
    openWhatsAppWithLanguage(caseData, lang);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div className="wa-lang-modal-overlay" onClick={onClose}>
        <motion.div
          className="wa-lang-modal-content"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="wa-lang-modal-header">
            <div className="wa-lang-header-title">
              <div className="wa-brand-icon-circle">
                <MessageCircle size={18} color="#ffffff" fill="#25d366" />
              </div>
              <div>
                <h3 className="wa-modal-title">Share via WhatsApp</h3>
                <p className="wa-modal-subtitle">செய்தி மொழியைத் தேர்வு செய்க (Select Language)</p>
              </div>
            </div>

            <button
              type="button"
              className="case-modal-close-btn"
              onClick={onClose}
              aria-label="Close language selector"
            >
              <X size={16} />
            </button>
          </div>

          {/* Client Recipient Tag */}
          <div className="wa-recipient-chip">
            <span className="wa-chip-label">Sending to:</span>
            <strong>{caseData.client_name}</strong>
            {caseData.client_phone && (
              <span className="wa-chip-phone">({caseData.client_phone})</span>
            )}
          </div>

          {/* Language Options Grid */}
          <div className="wa-lang-options-grid">
            {/* English Card */}
            <motion.button
              type="button"
              className="wa-lang-card"
              onClick={() => handleSelectLang('en')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="wa-lang-card-top">
                <span className="wa-flag-pill">🇬🇧 English</span>
                <span className="wa-send-pill">Send English ➔</span>
              </div>
              <div className="wa-lang-card-name">English Notice</div>
              <div className="wa-lang-preview-snippet">
                "Respected Client, This is to inform you that your case details are as follows..."
              </div>
            </motion.button>

            {/* Tamil Card */}
            <motion.button
              type="button"
              className="wa-lang-card wa-card-tamil"
              onClick={() => handleSelectLang('ta')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="wa-lang-card-top">
                <span className="wa-flag-pill wa-flag-tamil">🇮🇳 தமிழ் (Tamil)</span>
                <span className="wa-send-pill wa-send-tamil">அனுப்பு ➔</span>
              </div>
              <div className="wa-lang-card-name">தமிழ் அறிவிப்பு (Tamil Notice)</div>
              <div className="wa-lang-preview-snippet">
                "மதிப்பிற்குரிய வாடிக்கையாளருக்கு, உங்கள் வழக்கு தொடர்பான அடுத்த விசாரணை விவரங்கள்..."
              </div>
            </motion.button>
          </div>

          {/* Footer Cancel */}
          <div className="wa-lang-modal-footer">
            <button type="button" className="btn-wa-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
