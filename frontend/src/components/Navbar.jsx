import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Camera, LogOut, Shield, User as UserIcon, PlusCircle, LayoutDashboard } from 'lucide-react';

export function Navbar({ onNavigate, currentPage, onOpenCreateEvent }) {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="glass-panel" style={{
      margin: '16px auto',
      maxWidth: '1280px',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '16px',
      zIndex: 100,
    }}>
      {/* Brand Logo */}
      <div 
        onClick={() => onNavigate('dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'var(--lime-neon)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 18px rgba(204, 255, 0, 0.4)'
        }}>
          <Camera size={22} color="#000000" strokeWidth={2.5} />
        </div>
        <div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.03em'
          }}>
            Photo<span style={{ color: 'var(--lime-neon)' }}>Sphere</span>
          </span>
          <span style={{
            display: 'block',
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase'
          }}>
            Event Cloud
          </span>
        </div>
      </div>

      {/* Navigation Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user && (
          <>
            <button
              onClick={() => onNavigate('dashboard')}
              className={`btn ${currentPage === 'dashboard' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              <LayoutDashboard size={16} />
              Events
            </button>

            {isAdmin && onOpenCreateEvent && (
              <button
                onClick={onOpenCreateEvent}
                className="btn btn-secondary btn-sm"
                style={{ borderColor: 'rgba(204, 255, 0, 0.3)' }}
              >
                <PlusCircle size={16} color="var(--lime-neon)" />
                New Event
              </button>
            )}

            {/* User Profile & Role Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingLeft: '12px',
              borderLeft: '1px solid var(--border-subtle)'
            }}>
              <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                  <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-team'}`}>
                    {isAdmin ? <Shield size={10} /> : <UserIcon size={10} />}
                    {isAdmin ? 'Admin / Lead' : 'Team Member'}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Log Out"
                className="btn btn-secondary btn-sm"
                style={{ padding: '8px', borderRadius: '10px' }}
              >
                <LogOut size={16} color="#94a3b8" />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
