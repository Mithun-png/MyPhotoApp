import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, X, Image as ImageIcon, Loader2, Pencil, Check, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/client';

export function UploadDropzone({ eventId, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  // Clean up object URLs on unmount to prevent browser memory leaks
  useEffect(() => {
    return () => {
      selectedFiles.forEach(item => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });
    };
  }, []);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounterRef.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    // Reset file input so selecting the same file again triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFiles = (files) => {
    setErrorMessage('');
    setUploadResults(null);
    const validImages = files.filter(f => f.type.startsWith('image/'));
    if (validImages.length < files.length) {
      setErrorMessage('Some files were skipped: Only image formats (JPEG, PNG, WebP, AVIF) are supported.');
    }

    const newItems = validImages.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      name: f.name,
      preview: URL.createObjectURL(f)
    }));

    setSelectedFiles(prev => [...prev, ...newItems]);
  };

  const removeFile = (id) => {
    setSelectedFiles(prev => {
      const target = prev.find(item => item.id === id);
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter(item => item.id !== id);
    });
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
    selectedFiles.forEach(item => {
      if (item.preview) URL.revokeObjectURL(item.preview);
    });
    setSelectedFiles([]);
    setEditingId(null);
    setUploadResults(null);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || uploading) return;
    setUploading(true);
    setErrorMessage('');
    setUploadResults(null);

    try {
      const res = await api.uploadPhotos(eventId, selectedFiles);
      setUploadResults(res);
      if (res.successful > 0 && onUploadSuccess) {
        onUploadSuccess();
      }
      // If all succeeded, clear queue and previews
      if (res.failed === 0) {
        selectedFiles.forEach(item => {
          if (item.preview) URL.revokeObjectURL(item.preview);
        });
        setSelectedFiles([]);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Upload process failed. Please check network connection.');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
  };

  const totalPayloadBytes = selectedFiles.reduce((acc, curr) => acc + (curr.file?.size || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* Upload Results Banner */}
      {uploadResults && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: uploadResults.failed === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          border: `1px solid ${uploadResults.failed === 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {uploadResults.failed === 0 ? (
              <CheckCircle2 size={20} color="#34d399" style={{ flexShrink: 0 }} />
            ) : (
              <AlertCircle size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Upload Completed: <strong>{uploadResults.successful}</strong> photo{uploadResults.successful === 1 ? '' : 's'} added
              {uploadResults.failed > 0 && `, ${uploadResults.failed} failed`}.
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => setUploadResults(null)} 
            className="btn btn-secondary btn-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: '#fb7185',
          fontSize: '0.875rem'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{errorMessage}</span>
          <button 
            type="button" 
            onClick={() => setErrorMessage('')}
            style={{ background: 'transparent', border: 'none', color: '#fb7185', cursor: 'pointer', display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? 'var(--lime-neon)' : 'rgba(255, 255, 255, 0.18)'}`,
          borderRadius: 'var(--radius-md)',
          padding: selectedFiles.length > 0 ? '20px 16px' : '36px 20px',
          textAlign: 'center',
          backgroundColor: dragActive ? 'rgba(204, 255, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: selectedFiles.length > 0 ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: selectedFiles.length > 0 ? '14px' : '12px',
          boxShadow: dragActive ? '0 0 25px rgba(204, 255, 0, 0.2)' : 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
      >
        <div style={{
          width: selectedFiles.length > 0 ? '40px' : '52px',
          height: selectedFiles.length > 0 ? '40px' : '52px',
          borderRadius: '12px',
          background: 'rgba(204, 255, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--lime-neon)',
          flexShrink: 0
        }}>
          {selectedFiles.length > 0 ? <Plus size={20} /> : <UploadCloud size={28} />}
        </div>

        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {selectedFiles.length > 0 
              ? 'Click or drop more files to add to upload queue' 
              : 'Drag & drop high-resolution photographs here'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Supports JPG, PNG, WebP • Click anywhere to browse files
          </div>
        </div>
      </div>

      {/* Staged Files Queue */}
      {selectedFiles.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Queue Header & Actions Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Queue ({selectedFiles.length})
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>
                • {formatSize(totalPayloadBytes)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={clearQueue}
                disabled={uploading}
                className="btn btn-secondary btn-sm"
                title="Clear all staged files"
              >
                <Trash2 size={13} />
                Clear
              </button>

              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="btn btn-primary btn-sm"
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud size={14} />
                    Upload All ({selectedFiles.length})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Uploading Progress Notification */}
          {uploading && (
            <div style={{
              background: 'rgba(204, 255, 0, 0.08)',
              border: '1px solid rgba(204, 255, 0, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Loader2 size={18} color="var(--lime-neon)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                Uploading photos to cloud object storage. Please do not close this window...
              </div>
            </div>
          )}

          {/* Staged File List (Clean Row Architecture) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '290px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingRight: '4px'
          }}>
            {selectedFiles.map((item) => (
              <div
                key={item.id}
                className="staged-file-row"
                style={{
                  border: item.name !== item.file.name ? '1px solid rgba(204, 255, 0, 0.4)' : '1px solid var(--border-subtle)'
                }}
              >
                {/* Left: Thumbnail & Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  {item.preview ? (
                    <img 
                      src={item.preview} 
                      alt={item.name} 
                      className="staged-file-thumb"
                    />
                  ) : (
                    <div className="staged-file-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={20} color="var(--lime-neon)" />
                    </div>
                  )}

                  {editingId === item.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
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
                          flex: 1,
                          minWidth: '120px',
                          fontSize: '0.82rem',
                          padding: '6px 10px',
                          background: 'rgba(12, 12, 12, 0.95)',
                          border: '1px solid var(--lime-neon)',
                          borderRadius: '6px',
                          color: '#fff',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => saveEditing(item.id)}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '6px 8px', borderRadius: '6px' }}
                        title="Save name"
                      >
                        <Check size={13} strokeWidth={3} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 8px', borderRadius: '6px' }}
                        title="Cancel"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          title={item.name}
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
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
                              padding: '2px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              borderRadius: '4px',
                              transition: 'color 0.2s'
                            }}
                            title="Rename image before upload"
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--lime-neon)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{formatSize(item.file.size)}</span>
                        {item.name !== item.file.name && (
                          <span style={{
                            color: 'var(--lime-neon)',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            padding: '1px 6px',
                            background: 'rgba(204, 255, 0, 0.1)',
                            borderRadius: '4px'
                          }}>
                            renamed
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Quick Remove */}
                {!uploading && editingId !== item.id && (
                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    title="Remove from queue"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--accent-rose)';
                      e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <X size={15} />
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
