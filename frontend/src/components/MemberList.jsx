import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Check, UserCheck, Shield } from 'lucide-react';
import { api } from '../api/client';
import { Toast } from './Toast';

export function MemberList({ eventId, assignedMemberIds = [], onMembersUpdated }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedToAdd, setSelectedToAdd] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });

  // Quick pre-registration form state
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPass, setNewMemberPass] = useState('');
  const [creatingMember, setCreatingMember] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const members = await api.get('/auth/team-members');
      setTeamMembers(members);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async () => {
    if (!selectedToAdd) return;
    try {
      await api.post(`/events/${eventId}/members`, { member_ids: [selectedToAdd] });
      setSelectedToAdd('');
      setToast({ type: 'success', message: 'Team member assigned successfully' });
      if (onMembersUpdated) onMembersUpdated();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await api.delete(`/events/${eventId}/members/${userId}`);
      setToast({ type: 'success', message: 'Team member removed from event' });
      if (onMembersUpdated) onMembersUpdated();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleQuickRegister = async (e) => {
    e.preventDefault();
    setCreatingMember(true);
    try {
      // Admin registers team member
      await api.post('/auth/register', {
        name: newMemberName,
        email: newMemberEmail,
        password: newMemberPass,
        role: 'team_member'
      });
      setToast({ type: 'success', message: `Registered ${newMemberName} successfully!` });
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPass('');
      setShowQuickRegister(false);
      await fetchMembers();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setCreatingMember(false);
    }
  };

  const assignedList = teamMembers.filter(m => assignedMemberIds.includes(m.id || m._id));
  const unassignedList = teamMembers.filter(m => !assignedMemberIds.includes(m.id || m._id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {toast.message && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ type: '', message: '' })}
        />
      )}

      {/* Assign Member Input Row */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select
          value={selectedToAdd}
          onChange={(e) => setSelectedToAdd(e.target.value)}
          className="input-field"
          style={{ flex: 1 }}
          disabled={loading || unassignedList.length === 0}
        >
          <option value="">
            {unassignedList.length === 0
              ? 'All registered members are assigned'
              : 'Select a registered team member...'}
          </option>
          {unassignedList.map((m) => (
            <option key={m.id || m._id} value={m.id || m._id}>
              {m.name} ({m.email})
            </option>
          ))}
        </select>

        <button
          onClick={handleAddMember}
          disabled={!selectedToAdd}
          className="btn btn-primary btn-sm"
        >
          <UserPlus size={16} /> Assign
        </button>
      </div>

      {/* Button to toggle pre-registration */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => setShowQuickRegister(!showQuickRegister)}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
        >
          {showQuickRegister ? 'Cancel Registration' : '+ Pre-register New Team Member'}
        </button>
      </div>

      {/* Pre-register Form */}
      {showQuickRegister && (
        <form
          onSubmit={handleQuickRegister}
          style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Pre-register Team Member (Admin Action)
          </div>
          <input
            type="text"
            placeholder="Full Name (e.g., Marcus Vance)"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="input-field"
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            className="input-field"
            required
          />
          <input
            type="password"
            placeholder="Initial Password (min 6 chars)"
            value={newMemberPass}
            onChange={(e) => setNewMemberPass(e.target.value)}
            className="input-field"
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={creatingMember}
            className="btn btn-primary btn-sm"
            style={{ alignSelf: 'flex-start' }}
          >
            {creatingMember ? 'Creating Account...' : 'Create Member Account'}
          </button>
        </form>
      )}

      {/* Currently Assigned List */}
      <div>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '10px'
        }}>
          Assigned Roster ({assignedList.length})
        </div>

        {assignedList.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No photographers assigned yet. Assign team members above so they can upload photos.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assignedList.map((m) => (
              <div
                key={m.id || m._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--emerald-glow)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {m.email}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveMember(m.id || m._id)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--accent-rose)', padding: '6px' }}
                  title="Remove from event"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
