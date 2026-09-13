import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Toast } from './Toast';
import { Calendar, Users, PlusCircle } from 'lucide-react';

export function CreateEventModal({ isOpen, onClose, onEventCreated }) {
  const [name, setName] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedMemberIds([]);
      setError('');
      fetchTeamMembers();
    }
  }, [isOpen]);

  const fetchTeamMembers = async () => {
    try {
      const data = await api.get('/auth/team-members');
      setTeamMembers(data || []);
    } catch {
      // Ignored if unprivileged
    }
  };

  const toggleMemberSelection = (memberId) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const newEvent = await api.post('/events', {
        name: name.trim(),
        team_members: selectedMemberIds
      });
      if (onEventCreated) onEventCreated(newEvent);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {error && <Toast type="error" message={error} onClose={() => setError('')} />}

      <div className="input-group" style={{ marginBottom: 0 }}>
        <label className="input-label">Event Name / Project Title</label>
        <input
          type="text"
          placeholder="e.g. Arjun & Priya Wedding, Skyline Fashion Show"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          required
          autoFocus
        />
      </div>

      {/* Member Assignment Selection */}
      <div>
        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Users size={14} /> Assign Photographers to this Event
        </label>

        {teamMembers.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No other team members found. You can add photographers later from the event workspace.
          </div>
        ) : (
          <div style={{
            maxHeight: '180px',
            overflowY: 'auto',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {teamMembers.map((member) => {
              const mId = member.id || member._id;
              const isSelected = selectedMemberIds.includes(mId);
              return (
                <div
                  key={mId}
                  onClick={() => toggleMemberSelection(mId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(204, 255, 0, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid rgba(204, 255, 0, 0.4)' : '1px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {member.name} ({member.email})
                  </span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Handled by div click
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading || !name.trim()} className="btn btn-primary">
          <PlusCircle size={16} />
          {loading ? 'Creating Event...' : 'Create Event'}
        </button>
      </div>
    </form>
  );
}
