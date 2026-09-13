import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, X, Image as ImageIcon, Loader2, Pencil, Check } from 'lucide-react';
import { api } from '../api/client';

export function UploadDropzone({ eventId, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const [editingId, setEditingId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');

  const addFiles = (files) => {
    setErrorMessage('');
    setUploadResults(null);
    const validImages = files.filter(f => f.type.startsWith('image/'));
    if (validImages.length < files.length) {
      setErrorMessage('Some files were ignored because only image files (JPEG, PNG, WebP) are supported.');
    }
    
    // Append to existing queue with unique ID and mutable name
    const newItems = validImages.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      name: f.name
    }));
    setSelectedFiles(prev => [...prev, ...newItems]);
  };

  const removeFile = (id) => {
    setSelectedFiles(prev => prev.filter(item => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditNameValue(item.name);
  };

  const saveEditing = (id) => {
    const trimmed = editNameValue.trim();
    if (trimmed) {
      setSelectedFiles(prev => prev.map(item => item.id === id ? { ...item, name: trimmed } : item));
    }
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const clearQueue = () => {
    setSelectedFiles([]);
    setEditingId(null);
    setUploadResults(null);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setErrorMessage('');
    setUploadResults(null);

    try {
      const res = await api.uploadPhotos(eventId, selectedFiles);
      setUploadResults(res);
      if (res.successful > 0 && onUploadSuccess) {
        onUploadSuccess();
      }
      // If all succeeded, clear queue
      if (res.failed === 0) {
        setSelectedFiles([]);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Upload process failed. Please check network connection.');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    const kb = bytes / 1024;
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? 'var(--lime-neon)' : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '48px 24px',
          textAlign: 'center',
          backgroundColor: dragActive ? 'rgba(204, 255, 0, 0.08)' : 'rgba(12, 12, 12, 0.6)',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(204, 255, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--lime-neon)',
          boxShadow: '0 0 16px rgba(204, 255, 0, 0.2)'
        }}>
          <UploadCloud size={30} />
        </div>

        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Drag & drop multiple event photos here
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            or click to browse your files (JPEG, PNG, WebP)
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#fb7185',
          fontSize: '0.875rem'
        }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Results Summary */}
      {uploadResults && (
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          background: uploadResults.failed === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          border: `1px solid ${uploadResults.failed === 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {uploadResults.failed === 0 ? (
              <CheckCircle2 size={20} color="#34d399" />
            ) : (
              <AlertCircle size={20} color="#fbbf24" />
            )}
            <span>
              Upload Complete: <strong>{uploadResults.successful}</strong> succeeded
              {uploadResults.failed > 0 && `, ${uploadResults.failed} failed`}.
            </span>
          </div>
          <button onClick={clearQueue} className="btn btn-secondary btn-sm">
            Done
          </button>
        </div>
      )}

      {/* Staged Files Queue */}
      {selectedFiles.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            paddingBottom: '10px',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Staged for Upload ({selectedFiles.length} {selectedFiles.length === 1 ? 'photo' : 'photos'})
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={clearQueue}
                disabled={uploading}
                className="btn btn-secondary btn-sm"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="btn btn-primary btn-sm"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    Upload {selectedFiles.length} Photos
                  </>
                )}
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '4px'
          }}>
            {selectedFiles.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: item.name !== item.file.name ? '1px solid var(--lime-neon)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <ImageIcon size={18} color="var(--lime-neon)" style={{ flexShrink: 0 }} />
                  
                  {editingId === item.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing(item.id);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        autoFocus
                        style={{
                          width: '100%',
                          fontSize: '0.78rem',
                          padding: '3px 6px',
                          background: 'rgba(12, 12, 12, 0.95)',
                          border: '1px solid var(--lime-neon)',
                          borderRadius: '4px',
                          color: '#fff',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => saveEditing(item.id)}
                        style={{
                          background: 'var(--lime-neon)',
                          border: 'none',
                          color: '#000',
                          borderRadius: '4px',
                          padding: '3px 6px',
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
                        onClick={cancelEditing}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          color: 'var(--text-muted)',
                          borderRadius: '4px',
                          padding: '3px 6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Cancel"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          title={item.name}
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {item.name}
                        </span>
                        {!uploading && (
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '1px',
                              display: 'flex',
                              alignItems: 'center',
                              opacity: 0.8
                            }}
                            title="Edit image name"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{formatSize(item.file.size)}</span>
                        {item.name !== item.file.name && (
                          <span style={{ color: 'var(--lime-neon)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>renamed</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {!uploading && editingId !== item.id && (
                  <button
                    onClick={() => removeFile(item.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex'
                    }}
                    title="Remove file"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
