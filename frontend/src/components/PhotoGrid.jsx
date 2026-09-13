import React, { useState } from 'react';
import { PhotoCard } from './PhotoCard';
import { Image, Download, X } from 'lucide-react';

export function PhotoGrid({
  photos = [],
  isAdmin = false,
  onToggleSelect,
  onDelete,
  onRename,
  emptyMessage = "No photographs uploaded yet."
}) {
  const [activePhoto, setActivePhoto] = useState(null);

  if (!photos || photos.length === 0) {
    return (
      <div 
        className="glass-panel"
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px'
        }}
      >
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(204, 255, 0, 0.1)',
          border: '1px solid rgba(204, 255, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Image size={32} color="var(--lime-neon)" />
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {emptyMessage}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
          Upload high-resolution event captures to start collaborating and curating the collection.
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '20px',
      }}>
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id || photo._id}
            photo={photo}
            isAdmin={isAdmin}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
            onRename={onRename}
            onClick={(p) => setActivePhoto(p)}
          />
        ))}
      </div>

      {/* Full-Screen Lightbox Modal */}
      {activePhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 7, 12, 0.95)',
            backdropFilter: 'blur(16px)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setActivePhoto(null)}
        >
          {/* Lightbox Controls */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 2010
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <a
              href={activePhoto.cloudinary_url}
              download={activePhoto.filename}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              title="Open full resolution / Download"
            >
              <Download size={16} /> Download
            </a>
            <button
              onClick={() => setActivePhoto(null)}
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Lightbox Image View */}
          <div
            style={{
              maxWidth: '92vw',
              maxHeight: '82vh',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activePhoto.cloudinary_url}
              alt={activePhoto.filename}
              style={{
                maxWidth: '100%',
                maxHeight: '82vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)'
              }}
            />
          </div>

          {/* Caption */}
          <div style={{
            marginTop: '16px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activePhoto.filename}</span>
            {activePhoto.uploader_name && ` • Uploaded by ${activePhoto.uploader_name}`}
          </div>
        </div>
      )}
    </>
  );
}
