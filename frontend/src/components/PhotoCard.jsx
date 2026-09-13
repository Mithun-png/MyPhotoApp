import React, { useState, useEffect } from 'react';
import { Check, CheckSquare, Square, Trash2, Eye, User, Pencil, X } from 'lucide-react';

export function PhotoCard({
  photo,
  isAdmin = false,
  onToggleSelect,
  onDelete,
  onRename,
  onClick
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(photo.filename);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setEditedName(photo.filename);
  }, [photo.filename]);

  const handleSaveRename = async (e) => {
    if (e) e.preventDefault();
    const trimmed = editedName.trim();
    if (!trimmed || trimmed === photo.filename) {
      setIsEditing(false);
      setEditedName(photo.filename);
      return;
    }
    if (!onRename) return;
    try {
      setSavingName(true);
      await onRename(photo.id || photo._id, trimmed);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(1)} MB`;
    }
    return `${Math.round(kb)} KB`;
  };

  return (
    <div
      className="glass-card"
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: photo.is_selected 
          ? '2px solid var(--lime-neon)' 
          : '1px solid var(--border-subtle)',
        boxShadow: photo.is_selected 
          ? '0 0 18px rgba(204, 255, 0, 0.4)' 
          : 'var(--shadow-card)',
      }}
    >
      {/* Image Preview Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '75%', // 4:3 Aspect Ratio
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={() => onClick && onClick(photo)}
      >
        <img
          src={photo.cloudinary_url}
          alt={photo.filename}
          loading="lazy"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />

        {/* Hover overlay hint */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.25)',
          opacity: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
        >
          <span style={{
            background: 'rgba(12, 12, 12, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Eye size={14} /> Preview
          </span>
        </div>

        {/* Selection Badge (Admin) */}
        {isAdmin && onToggleSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(photo.id || photo._id, !photo.is_selected);
            }}
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: photo.is_selected ? 'var(--lime-neon)' : 'rgba(12, 12, 12, 0.85)',
              backdropFilter: 'blur(8px)',
              border: photo.is_selected ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
              color: photo.is_selected ? '#000000' : '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            title={photo.is_selected ? 'Deselect photo' : 'Select photo for gallery'}
          >
            {photo.is_selected ? <Check size={18} strokeWidth={3} color="#000000" /> : null}
          </button>
        )}

        {/* Selected Indicator Pill */}
        {photo.is_selected && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'var(--lime-neon)',
            color: '#000000',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            boxShadow: '0 0 10px rgba(204, 255, 0, 0.5)'
          }}>
            Selected
          </div>
        )}
      </div>

      {/* Info Bar */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {isEditing ? (
          <form
            onSubmit={handleSaveRename}
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}
          >
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditedName(photo.filename);
                }
              }}
              autoFocus
              disabled={savingName}
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '3px 6px',
                background: 'rgba(12, 12, 12, 0.95)',
                border: '1px solid var(--lime-neon)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={savingName}
              style={{
                background: 'var(--lime-neon)',
                border: 'none',
                color: '#000000',
                borderRadius: '4px',
                padding: '4px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Save name"
            >
              <Check size={12} strokeWidth={3} />
            </button>
            <button
              type="button"
              disabled={savingName}
              onClick={() => {
                setIsEditing(false);
                setEditedName(photo.filename);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'var(--text-muted)',
                borderRadius: '4px',
                padding: '4px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Cancel"
            >
              <X size={12} />
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={photo.filename}
            >
              {photo.filename}
            </div>
            {isAdmin && onRename && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditedName(photo.filename);
                  setIsEditing(true);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  transition: 'color 0.2s'
                }}
                title="Edit image name"
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--lime-neon)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} />
            {photo.uploader_name || 'Team'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{formatSize(photo.file_size)}</span>
        </div>

        {isAdmin && onDelete && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete ${photo.filename}?`)) {
                  onDelete(photo.id || photo._id);
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
