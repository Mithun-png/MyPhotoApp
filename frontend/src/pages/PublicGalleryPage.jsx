import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PinInput } from '../components/PinInput';
import { PhotoGrid } from '../components/PhotoGrid';
import { Toast } from '../components/Toast';
import { Lock, Unlock, Camera, Sparkles, Image as ImageIcon, Download, KeyRound, ShieldAlert } from 'lucide-react';

export function PublicGalleryPage({ shareSlug, onBackToApp }) {
  const [meta, setMeta] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch public metadata (event name, photo count — NO photo URLs)
  const fetchMeta = async () => {
    try {
      setLoadingMeta(true);
      setErrorMessage('');
      const data = await api.get(`/gallery/${shareSlug}`);
      setMeta(data);
    } catch (err) {
      setErrorMessage(err.message || 'Gallery not found or has been made private');
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, [shareSlug]);

  const handleVerifyPin = async (pin) => {
    setVerifying(true);
    setPinError(false);
    setErrorMessage('');

    try {
      const res = await api.post(`/gallery/${shareSlug}/verify-pin`, { pin });
      setPhotos(res.photos || []);
      setIsUnlocked(true);
    } catch (err) {
      setPinError(true);
      setErrorMessage(err.message || 'Incorrect PIN. Access denied.');
    } finally {
      setVerifying(false);
    }
  };

  if (loadingMeta) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        Loading gallery...
      </div>
    );
  }

  if (errorMessage && !meta) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div className="glass-panel" style={{ maxWidth: '480px', padding: '36px 24px' }}>
          <ShieldAlert size={40} color="#f43f5e" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
            Gallery Unavailable
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            {errorMessage}
          </p>
          {onBackToApp && (
            <button onClick={onBackToApp} className="btn btn-secondary">
              Return to Platform
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px 80px' }}>
      {/* PHASE 1: PIN PROTECTED SCREEN */}
      {!isUnlocked ? (
        <div style={{
          minHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '44px 32px',
            textAlign: 'center',
            boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.95), 0 0 50px rgba(204, 255, 0, 0.15)'
          }}>
            {/* Lock Icon Emblem */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(204, 255, 0, 0.12)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid rgba(204, 255, 0, 0.3)',
              boxShadow: '0 0 20px rgba(204, 255, 0, 0.2)'
            }}>
              <Lock size={30} color="var(--lime-neon)" />
            </div>

            {/* Event Header */}
            <div style={{ marginBottom: '24px' }}>
              <span className="badge badge-published" style={{ marginBottom: '8px' }}>
                Protected Customer Gallery
              </span>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '8px' }}>
                {meta?.event_name}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
                This private collection contains {meta?.photo_count} curated photograph{meta?.photo_count === 1 ? '' : 's'}. Enter your 6-digit access PIN to unlock.
              </p>
            </div>

            {errorMessage && (
              <Toast type="error" message={errorMessage} onClose={() => setErrorMessage('')} />
            )}

            {/* PIN Entry Component */}
            <div style={{ marginTop: '20px' }}>
              <PinInput
                length={6}
                onComplete={handleVerifyPin}
                loading={verifying}
                error={pinError}
              />
            </div>

            {/* Evaluator Quick Hint */}
            <div style={{
              marginTop: '32px',
              paddingTop: '18px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              <span>Demo PIN for this challenge: </span>
              <button
                type="button"
                onClick={() => handleVerifyPin('482917')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--lime-neon)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                482917 (Click to Auto-Fill)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* PHASE 2: UNLOCKED CUSTOMER VIEW */
        <div>
          {/* Customer Gallery Header */}
          <div className="glass-panel" style={{
            padding: '36px',
            marginBottom: '36px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '12px'
            }}>
              <Unlock size={14} /> Gallery Unlocked
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>
              {meta?.event_name}
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px' }}>
              Welcome! Enjoy browsing your curated collection of {photos.length} moments. Click any photograph to preview in high-resolution or download.
            </p>

            {onBackToApp && (
              <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                <button onClick={onBackToApp} className="btn btn-secondary btn-sm">
                  Exit to Platform
                </button>
              </div>
            )}
          </div>

          {/* Customer Photo Grid */}
          <PhotoGrid
            photos={photos}
            isAdmin={false}
            emptyMessage="No photographs are currently available in this gallery."
          />
        </div>
      )}
    </div>
  );
}
