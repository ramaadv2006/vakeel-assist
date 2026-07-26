import { useEffect, useState } from 'react';
import { useFlashState } from '../context/FlashContext';
import Icon from './Icon';

const ICONS = { success: 'check', error: 'info', warning: 'warning' };

function FlashItem({ flash, onRemove }) {
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDismissing(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!dismissing) return;
    const timer = setTimeout(() => onRemove(flash.id), 500);
    return () => clearTimeout(timer);
  }, [dismissing, flash.id, onRemove]);

  return (
    <div className={`flash ${flash.category}${dismissing ? ' dismissing' : ''}`}>
      <Icon name={ICONS[flash.category] || 'info'} />
      {flash.message}
      <span
        style={{ marginLeft: 'auto', cursor: 'pointer', fontSize: 18, fontWeight: 'bold', opacity: 0.7, paddingLeft: 12 }}
        onClick={() => setDismissing(true)}
      >
        &times;
      </span>
    </div>
  );
}

export default function FlashMessages() {
  const { flashes, removeFlash } = useFlashState();
  if (flashes.length === 0) return null;

  return (
    <div className="flash-container">
      {flashes.map((flash) => (
        <FlashItem key={flash.id} flash={flash} onRemove={removeFlash} />
      ))}
    </div>
  );
}
