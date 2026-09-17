import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { PhotoGrid } from '../components/PhotoGrid';
import { UploadDropzone } from '../components/UploadDropzone';
import { MemberList } from '../components/MemberList';
import { GalleryPublishModal } from '../components/GalleryPublishModal';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import {
  ArrowLeft, UploadCloud, Users, Share2, CheckSquare, Square,
  ShieldCheck, Clock, Filter, ExternalLink
} from 'lucide-react';

export function EventDetailPage({ eventId, onBack, onNavigateToGallery }) {
  const { user, isAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'selected'
  const [toast, setToast] = useState({ type: '', message: '' });

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const [eventData, photosData] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/photos`),
      ]);
      setEvent(eventData);
      setPhotos(photosData);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load event data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const handleToggleSelect = async (photoId, isSelected) => {
    try {
      await api.patch(`/photos/${photoId}/select`, { is_selected: isSelected });
      setPhotos(prev => prev.map(p => (p.id === photoId || p._id === photoId) ? { ...p, is_selected: isSelected } : p));
      setEvent(prev => prev ? {
        ...prev,
        selected_photo_count: isSelected
          ? (prev.selected_photo_count || 0) + 1
          : Math.max(0, (prev.selected_photo_count || 0) - 1)
      } : prev);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleBulkSelect = async (selectValue) => {
    const photoIds = photos.map(p => p.id || p._id);
    if (photoIds.length === 0) return;

    try {
      await api.patch(`/events/${eventId}/photos/select`, {
        photo_ids: photoIds,
        is_selected: selectValue
      });
      setPhotos(prev => prev.map(p => ({ ...p, is_selected: selectValue })));
      setEvent(prev => prev ? {
        ...prev,
        selected_photo_count: selectValue ? photoIds.length : 0
      } : prev);
      setToast({
        type: 'success',
        message: selectValue ? `Selected all ${photoIds.length} photos` : 'Deselected all photos'
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await api.delete(`/photos/${photoId}`);
      setPhotos(prev => prev.filter(p => p.id !== photoId && p._id !== photoId));
      fetchEventData();
      setToast({ type: 'success', message: 'Photo deleted successfully' });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleRenamePhoto = async (photoId, newFilename) => {
    try {
      const updated = await api.patch(`/photos/${photoId}`, { filename: newFilename });
      setPhotos(prev => prev.map(p => (p.id === photoId || p._id === photoId) ? { ...p, filename: updated.filename || newFilename } : p));
      setToast({ type: 'success', message: `Photo renamed to "${newFilename}"` });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to rename photo' });
      throw err;
    }
  };

  const displayedPhotos = filterMode === 'selected'
    ? photos.filter(p => p.is_selected)
    : photos;

  const selectedCount = photos.filter(p => p.is_selected).length;

  if (loading && !event) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading event workspace...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h3>Event not found or access denied</h3>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      {toast.message && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ type: '', message: '' })}
        />
      )}

      {/* Back navigation */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={onBack} className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Events
        </button>
      </div>

      {/* Event Header Banner */}
      <div className="glass-panel" style={{
        padding: '30px',
        marginBottom: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className={`badge ${event.is_gallery_published ? 'badge-published' : 'badge-draft'}`}>
                {event.is_gallery_published ? (
                  <>
                    <ShieldCheck size={12} /> Gallery Published
                  </>
                ) : (
                  <>
                    <Clock size={12} /> Curation In Progress
                  </>
                )}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Event ID: {event.id || event._id}
              </span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {event.name}
            </h1>

            {event.is_gallery_published && event.gallery_slug && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Public Link:
                </span>
                <button
                  onClick={() => onNavigateToGallery(event.gallery_slug)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--lime-neon)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'underline'
                  }}
                >
                  /gallery/{event.gallery_slug} <ExternalLink size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-secondary"
            >
              <UploadCloud size={16} color="var(--lime-neon)" />
              Upload Photos
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setShowMembersModal(true)}
                  className="btn btn-secondary"
                >
                  <Users size={16} />
                  Team ({event.team_members?.length || 0})
                </button>

                <button
                  onClick={() => setShowPublishModal(true)}
                  className="btn btn-primary"
                >
                  <Share2 size={16} />
                  {event.is_gallery_published ? 'Update Gallery' : 'Publish Gallery'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Admin Photo Curation Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px',
        padding: '14px 20px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)'
      }}>
        {/* Left: Stats & Bulk Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <strong style={{ fontFamily: 'var(--font-mono)' }}>{photos.length}</strong> Total Uploads • <strong style={{ color: 'var(--lime-neon)', fontFamily: 'var(--font-mono)' }}>{selectedCount}</strong> Selected
          </div>

          {isAdmin && photos.length > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleBulkSelect(true)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                title="Select all photos for customer gallery"
              >
                <CheckSquare size={14} /> Select All
              </button>

              <button
                onClick={() => handleBulkSelect(false)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                title="Deselect all"
              >
                <Square size={14} /> Deselect All
              </button>
            </div>
          )}
        </div>

        {/* Right: Filter tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setFilterMode('all')}
            className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 12px', fontSize: '0.8rem' }}
          >
            All Photos ({photos.length})
          </button>
          <button
            onClick={() => setFilterMode('selected')}
            className={`btn btn-sm ${filterMode === 'selected' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 12px', fontSize: '0.8rem' }}
          >
            Curated Only ({selectedCount})
          </button>
        </div>
      </div>

      {/* Photo Grid */}
      <PhotoGrid
        photos={displayedPhotos}
        isAdmin={isAdmin}
        onToggleSelect={handleToggleSelect}
        onDelete={handleDeletePhoto}
        onRename={handleRenamePhoto}
        emptyMessage={
          filterMode === 'selected'
            ? 'No photos are currently selected for this gallery.'
            : 'No photographs uploaded for this event yet.'
        }
      />

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={`Upload Photos — ${event.name}`}
        maxWidth="720px"
      >
        <UploadDropzone
          eventId={eventId}
          onUploadSuccess={() => {
            fetchEventData();
          }}
        />
      </Modal>

      {/* Members Modal */}
      {isAdmin && (
        <Modal
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          title="Manage Assigned Photographers"
          maxWidth="560px"
        >
          <MemberList
            eventId={eventId}
            assignedMemberIds={event.team_members || []}
            onMembersUpdated={() => fetchEventData()}
          />
        </Modal>
      )}

      {/* Publish Gallery Modal */}
      {isAdmin && (
        <Modal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          title="Publish Customer Gallery"
          maxWidth="520px"
        >
          <GalleryPublishModal
            eventId={eventId}
            eventName={event.name}
            selectedCount={selectedCount}
            isAlreadyPublished={event.is_gallery_published}
            currentSlug={event.gallery_slug}
            onPublished={(res) => {
              fetchEventData();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
