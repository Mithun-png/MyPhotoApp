import React, { useState, useRef, useEffect } from 'react';
import { Lock, Unlock, KeyRound } from 'lucide-react';

export function PinInput({ length = 6, onComplete, loading = false, error = false }) {
  const [pin, setPin] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return; // Digits only

    const newPin = [...pin];
    // Handle paste of whole PIN
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, length).split('');
      for (let i = 0; i < length; i++) {
        newPin[i] = digits[i] || '';
      }
      setPin(newPin);
      const nextIndex = Math.min(digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      if (newPin.every(d => d !== '')) {
        onComplete(newPin.join(''));
      }
      return;
    }

    newPin[index] = value;
    setPin(newPin);

    // Auto-advance to next box
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger complete callback when all filled
    if (newPin.every(d => d !== '')) {
      onComplete(newPin.join(''));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const fullPin = pin.join('');
    if (fullPin.length === length) {
      onComplete(fullPin);
    }
  };

  return (
    <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div 
        className={error ? 'shake-error' : ''}
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}
      >
        {pin.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="password"
            inputMode="numeric"
            maxLength={index === 0 ? length : 1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={loading}
            style={{
              width: '52px',
              height: '62px',
              fontSize: '1.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
              background: 'rgba(12, 12, 12, 0.95)',
              color: digit ? 'var(--lime-neon)' : 'var(--text-primary)',
              border: error ? '2px solid var(--accent-rose)' : digit ? '1px solid var(--lime-neon)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: digit ? '0 0 16px rgba(204, 255, 0, 0.35)' : 'none',
            }}
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={loading || pin.some(d => d === '')}
        className="btn btn-primary btn-lg"
        style={{ width: '100%', maxWidth: '380px' }}
      >
        {loading ? (
          <>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>●</span>
            Verifying PIN...
          </>
        ) : (
          <>
            <Unlock size={18} />
            Unlock Gallery
          </>
        )}
      </button>
    </form>
  );
}
