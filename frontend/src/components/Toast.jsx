import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export function Toast({ type = 'info', message, onClose }) {
  if (!message) return null;

  const config = {
    success: {
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.35)',
      color: '#34d399',
      icon: <CheckCircle2 size={18} color="#34d399" />
    },
    error: {
      bg: 'rgba(244, 63, 94, 0.15)',
      border: 'rgba(244, 63, 94, 0.35)',
      color: '#fb7185',
      icon: <AlertCircle size={18} color="#fb7185" />
    },
    info: {
      bg: 'rgba(204, 255, 0, 0.12)',
      border: 'rgba(204, 255, 0, 0.35)',
      color: 'var(--lime-neon)',
      icon: <Info size={18} color="var(--lime-neon)" />
    }
  }[type] || {
    bg: 'rgba(204, 255, 0, 0.12)',
    border: 'rgba(204, 255, 0, 0.35)',
    color: 'var(--lime-neon)',
    icon: <Info size={18} color="var(--lime-neon)" />
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      padding: '12px 18px',
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 'var(--radius-md)',
      color: config.color,
      marginBottom: '16px',
      fontSize: '0.9rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {config.icon}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex'
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
