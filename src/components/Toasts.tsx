import { useState, useEffect, useRef } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger' | 'gold';
  duration?: number;
}

const TOAST_COLORS: Record<Toast['type'], { bg: string; border: string; icon: string }> = {
  info:    { bg: 'rgba(26,42,74,0.92)',   border: 'var(--blue-light)', icon: 'ℹ️' },
  success: { bg: 'rgba(26,74,26,0.92)',   border: 'var(--green-light)', icon: '✅' },
  warning: { bg: 'rgba(100,74,10,0.92)',  border: 'var(--gold)',        icon: '⚠️' },
  danger:  { bg: 'rgba(138,42,26,0.92)',  border: 'var(--red)',         icon: '❌' },
  gold:    { bg: 'rgba(80,60,10,0.92)',   border: 'var(--gold-light)',  icon: '🪙' },
};

// Global toast state — simple pub/sub
type Listener = (toasts: Toast[]) => void;
let _toasts: Toast[] = [];
const _listeners: Set<Listener> = new Set();
let _idCounter = 0;

function notify() {
  for (const l of _listeners) l([..._toasts]);
}

export function showToast(message: string, type: Toast['type'] = 'info', duration = 3500) {
  const id = `toast-${++_idCounter}`;
  _toasts = [..._toasts, { id, message, type, duration }];
  notify();

  setTimeout(() => {
    _toasts = _toasts.filter(t => t.id !== id);
    notify();
  }, duration);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener: Listener = (t) => setToasts(t);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '380px',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => {
        const colors = TOAST_COLORS[toast.type];
        return (
          <div
            key={toast.id}
            className="slide-up"
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              padding: '10px 14px',
              fontSize: '13px',
              color: 'var(--parchment)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              pointerEvents: 'auto',
            }}
          >
            <span style={{ fontSize: '16px', flexShrink: 0 }}>{colors.icon}</span>
            <span style={{ lineHeight: '1.4' }}>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// Hook to auto-watch message log and show new entries as toasts
export function useMessageLogToasts(messageLog: string[], enabled: boolean) {
  const lastLengthRef = useRef(messageLog.length);

  useEffect(() => {
    if (!enabled) return;
    const newMessages = messageLog.slice(lastLengthRef.current);
    lastLengthRef.current = messageLog.length;

    for (const msg of newMessages) {
      let type: Toast['type'] = 'info';
      if (msg.includes('❌') || msg.includes('💀') || msg.includes('lost') || msg.includes('deserted')) type = 'danger';
      else if (msg.includes('✅') || msg.includes('Sold') || msg.includes('profit') || msg.includes('Reward')) type = 'success';
      else if (msg.includes('⚠️') || msg.includes('EXPIRED') || msg.includes('couldn\'t')) type = 'warning';
      else if (msg.includes('🪙') || msg.includes('Gold') || msg.includes('💰')) type = 'gold';
      showToast(msg, type);
    }
  }, [messageLog.length, enabled]);
}
