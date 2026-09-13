import React, { useState } from 'react';
import { Share2, Sparkles, Copy, Check, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { Toast } from './Toast';

export function GalleryPublishModal({ eventId, eventName, selectedCount, isAlreadyPublished, currentSlug, onPublished }) {
  const [pin, setPin] = useState('482917');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publishResult, setPublishResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateRandomPin = () => {
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(random);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(pin)) {
      setError('PIN must be between 4 and 8 numeric digits');
      return;
    }

    if (selectedCount === 0) {
      setError('You must select at least one photo before publishing a gallery.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post(`/events/${eventId}/gallery`, { pin });
      setPublishResult(res);
      if (onPublished) onPublished(res);
    } catch (err) {
      setError(err.message || 'Failed to publish gallery');
    } finally {
      setLoading(false);
    }
  };

  const fullShareUrl = publishResult
    ? `${window.location.origin}/gallery/${publishResult.share_slug}`
    : currentSlug
    ? `${window.location.origin}/gallery/${currentSlug}`
    : '';

  const copyToClipboard = () => {
    if (fullShareUrl) {
      navigator.clipboard.writeText(`${fullShareUrl}\nPIN: ${publishResult?.pin || pin}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && <Toast type="error" message={error} onClose={() => setError('')} />}

      {publishResult ? (
        // Success State
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto'
          }}>
            <ShieldCheck size={32} color="#34d399" />
          </div>

          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Gallery Live & Protected!
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Your customer gallery has been successfully published with {publishResult.selected_photo_count} curated photos.
            </p>
          </div>

          {/* Share Credentials Box */}
          <div style={{
            background: 'rgba(12, 12, 12, 0.95)',
            border: '1px solid rgba(204, 255, 0, 0.35)',
            boxShadow: '0 0 20px rgba(204, 255, 0, 0.15)',
            borderRadius: 'var(--radius-md)',
            padding: '18px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Customer Share Link
              </div>
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--lime-neon)',
                fontFamily: 'var(--font-mono)',
                wordBreak: 'break-all',
                marginTop: '3px'
              }}>
                {fullShareUrl}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Customer Access PIN
              </div>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                letterSpacing: '0.18em',
                color: 'var(--lime-neon)',
                fontFamily: 'var(--font-mono)',
                marginTop: '2px'
              }}>
                {publishResult.pin}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={copyToClipboard} className="btn btn-primary" style={{ flex: 1 }}>
              {copied ? (
                <>
                  <Check size={16} /> Link & PIN Copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy Credentials
                </>
              )}
            </button>

            <a
              href={fullShareUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ padding: '10px 14px' }}
              title="Preview Customer View"
            >
              <ExternalLink size={16} /> Open
            </a>
          </div>
        </div>
      ) : (
        // Publish Configuration Form
        <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Summary Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Event</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{eventName}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Photos to Publish</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--lime-neon)', fontFamily: 'var(--font-mono)' }}>
                {selectedCount} Selected
              </div>
            </div>
          </div>

          {selectedCount === 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#fbbf24',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={16} />
              <span>Please select at least 1 photo before publishing.</span>
            </div>
          )}

          {/* PIN Configuration */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="input-label">Numeric Gallery Access PIN</label>
              <button
                type="button"
                onClick={generateRandomPin}
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 8px', fontSize: '0.75rem', borderColor: 'rgba(204, 255, 0, 0.3)' }}
              >
                <Sparkles size={12} color="var(--lime-neon)" /> Auto-Generate
              </button>
            </div>
            <input
              type="text"
              pattern="\d*"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 482917"
              className="input-field"
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                color: 'var(--lime-neon)'
              }}
              required
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Customers will be required to enter this PIN to access their curated photo gallery.
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || selectedCount === 0 || !pin}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Publishing Gallery...' : (
              <>
                <Share2 size={18} />
                {isAlreadyPublished ? 'Update Published Gallery' : 'Publish Customer Gallery'}
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
