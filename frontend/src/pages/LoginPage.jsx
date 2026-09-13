import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Shield, User, Lock, Mail, ArrowRight, Eye, EyeOff, Terminal } from 'lucide-react';
import { Toast } from '../components/Toast';
import '../styles/obsidian-lime.css';

export function LoginPage({ onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your access credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Evaluation demo credentials quick-fill helpers
  const fillAdmin = () => {
    setEmail('admin@trizen.ai');
    setPassword('Admin@12345');
    setError('');
  };

  const fillTeam = () => {
    setEmail('photographer@trizen.ai');
    setPassword('Team@12345');
    setError('');
  };

  return (
    <div className="obsidian-login-viewport">
      {/* 60x60 Grid Background */}
      <div className="obsidian-grid-pattern" />

      {/* Noise Texture Overlay */}
      <div className="obsidian-noise-overlay" />

      {/* Glow-Spheres with 120px blur (Neon Lime & Emerald Glow) */}
      <div className="obsidian-glow-sphere-1" />
      <div className="obsidian-glow-sphere-2" />

      {/* Floating Shell / Glass Card */}
      <div className="obsidian-floating-card">
        {/* Top: System Status Tag */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="obsidian-status-tag">
            <span className="obsidian-pulse-dot" />
            <span>SYSTEM ONLINE // AUTH GATE</span>
          </div>
        </div>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            backgroundColor: '#ccff00',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(204, 255, 0, 0.4)',
            marginBottom: '16px',
            transform: 'rotate(-2deg)'
          }}>
            <Camera size={26} color="#000000" strokeWidth={2.5} />
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.06em',
            color: '#ebebeb',
            margin: '0 0 8px 0',
            lineHeight: 1.1
          }}>
            Photo<span style={{ color: '#ccff00', fontStyle: 'italic' }}>Sphere</span>
          </h1>

          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '0.88rem',
            color: 'rgba(235, 235, 235, 0.6)',
            margin: 0,
            fontWeight: 400
          }}>
            Enter your credentials to access the photography workspace
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '18px' }}>
            <Toast type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email Field */}
          <div className="obsidian-input-group">
            <label className="obsidian-label">
              User Identifier // Email
            </label>
            <div className="obsidian-field">
              <Mail size={16} color="#ccff00" style={{ flexShrink: 0, opacity: 0.85 }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@trizen.ai"
                className="obsidian-input"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="obsidian-input-group">
            <label className="obsidian-label">
              Security Key // Password
            </label>
            <div className="obsidian-field">
              <Lock size={16} color="#ccff00" style={{ flexShrink: 0, opacity: 0.85 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="obsidian-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(235, 235, 235, 0.4)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ccff00')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(235, 235, 235, 0.4)')}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Neon Pulse Primary Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="obsidian-neon-btn"
          >
            {loading ? (
              <span>AUTHENTICATING NODE...</span>
            ) : (
              <>
                <span>AUTHORIZE SESSION</span>
                <ArrowRight size={18} strokeWidth={2.8} />
              </>
            )}
          </button>
        </form>

        {/* Evaluation Shortcuts Section */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center'
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: 'rgba(235, 235, 235, 0.4)',
            marginBottom: '12px'
          }}>
            EVALUATION SHORTCUTS // 01 & 02
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={fillAdmin}
              className="obsidian-shortcut-btn"
              title="Auto-fill Lead Admin credentials"
            >
              <Shield size={14} color="#ccff00" />
              <span>Admin Key</span>
            </button>

            <button
              type="button"
              onClick={fillTeam}
              className="obsidian-shortcut-btn"
              title="Auto-fill Team Photographer credentials"
            >
              <User size={14} color="#10b981" />
              <span>Team Key</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
