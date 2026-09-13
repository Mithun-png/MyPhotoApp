import React from 'react';
import { Calendar, Users, Image as ImageIcon, ExternalLink, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export function EventCard({ event, onSelect }) {
  const formattedDate = new Date(event.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        cursor: 'pointer',
      }}
      onClick={() => onSelect(event.id || event._id)}
    >
      <div>
        {/* Status Badge & Date */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
          <span className={`badge ${event.is_gallery_published ? 'badge-published' : 'badge-draft'}`}>
            {event.is_gallery_published ? (
              <>
                <ShieldCheck size={12} /> Published
              </>
            ) : (
              <>
                <Clock size={12} /> Curation Draft
              </>
            )}
          </span>

          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} /> {formattedDate}
          </span>
        </div>

        {/* Event Name */}
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '16px',
          lineHeight: 1.3
        }}>
          {event.name}
        </h3>

        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          padding: '14px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Photos
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {event.photo_count || 0}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Selected Curated
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--lime-neon)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {event.selected_photo_count || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Action */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '14px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <Users size={14} color="var(--emerald-glow)" />
          <span>{event.team_members?.length || 0} Team Photographer{event.team_members?.length === 1 ? '' : 's'}</span>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          style={{ padding: '6px 12px' }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(event.id || event._id);
          }}
        >
          View <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
