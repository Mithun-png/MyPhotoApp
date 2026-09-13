import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { EventCard } from '../components/EventCard';
import { Toast } from '../components/Toast';
import { PlusCircle, Search, Calendar, ShieldCheck, Image as ImageIcon, Sparkles } from 'lucide-react';

export function DashboardPage({ onSelectEvent, onOpenCreateEvent }) {
  const { user, isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.get('/events');
      setEvents(data);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPhotos = events.reduce((acc, curr) => acc + (curr.photo_count || 0), 0);
  const publishedCount = events.filter((e) => e.is_gallery_published).length;

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      {error && <Toast type="error" message={error} onClose={() => setError('')} />}

      {/* Hero Header & Metrics */}
      <div style={{
        marginBottom: '36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(204, 255, 0, 0.1)',
              color: 'var(--lime-neon)',
              border: '1px solid rgba(204, 255, 0, 0.25)',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '10px'
            }}>
              <Sparkles size={13} />
              {isAdmin ? 'Workspace Overview' : 'Assigned Photography Assignments'}
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>
              {isAdmin ? 'Photography Events' : 'My Event Assignments'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
              {isAdmin
                ? 'Coordinate team uploads, curate best captures, and publish PIN-protected customer galleries.'
                : 'Upload your high-resolution event captures to your assigned events below.'}
            </p>
          </div>

          {isAdmin && (
            <button onClick={onOpenCreateEvent} className="btn btn-primary btn-lg">
              <PlusCircle size={18} />
              Create Event
            </button>
          )}
        </div>

        {/* Quick Metrics Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Calendar size={16} color="var(--lime-neon)" />
              <span>Active Events</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
              {events.length}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <ImageIcon size={16} color="var(--emerald-glow)" />
              <span>Total Photographs</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
              {totalPhotos}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <ShieldCheck size={16} color="var(--emerald-glow)" />
              <span>Published Galleries</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
              {publishedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '420px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search events by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '40px' }}
          />
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing {filteredEvents.length} of {events.length} events
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          Loading events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No events found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            {search ? 'Try adjusting your search query.' : 'Get started by creating your first photography event.'}
          </p>
          {isAdmin && !search && (
            <button onClick={onOpenCreateEvent} className="btn btn-primary">
              <PlusCircle size={16} /> Create First Event
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id || event._id}
              event={event}
              onSelect={onSelectEvent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
