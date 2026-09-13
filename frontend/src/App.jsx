import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { PublicGalleryPage } from './pages/PublicGalleryPage';
import { CreateEventModal } from './components/CreateEventModal';
import { Modal } from './components/Modal';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [publicGallerySlug, setPublicGallerySlug] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check URL pathname for direct public customer gallery links e.g. /gallery/:slug
  useEffect(() => {
    const path = window.location.pathname;
    const galleryMatch = path.match(/^\/gallery\/([a-zA-Z0-9_-]+)/);
    if (galleryMatch && galleryMatch[1]) {
      setPublicGallerySlug(galleryMatch[1]);
      setCurrentPage('public-gallery');
    }
  }, []);

  const navigateTo = (page, params = {}) => {
    if (page === 'public-gallery' && params.slug) {
      setPublicGallerySlug(params.slug);
      window.history.pushState({}, '', `/gallery/${params.slug}`);
    } else if (page === 'dashboard') {
      setSelectedEventId(null);
      setPublicGallerySlug(null);
      window.history.pushState({}, '', '/');
    }
    setCurrentPage(page);
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    setCurrentPage('event-detail');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        Initializing PhotoSphere...
      </div>
    );
  }

  // 1. If currently on a public customer gallery link
  if (currentPage === 'public-gallery' && publicGallerySlug) {
    return (
      <PublicGalleryPage
        shareSlug={publicGallerySlug}
        onBackToApp={() => navigateTo('dashboard')}
      />
    );
  }

  // 2. If not authenticated, render Login Page
  if (!user) {
    return (
      <LoginPage onSuccess={() => navigateTo('dashboard')} />
    );
  }

  // 3. Authenticated Platform Navigation
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => navigateTo(page)}
        onOpenCreateEvent={() => setIsCreateModalOpen(true)}
      />

      <main style={{ flex: 1, marginTop: '12px' }}>
        {currentPage === 'dashboard' && (
          <DashboardPage
            onSelectEvent={handleSelectEvent}
            onOpenCreateEvent={() => setIsCreateModalOpen(true)}
          />
        )}

        {currentPage === 'event-detail' && selectedEventId && (
          <EventDetailPage
            eventId={selectedEventId}
            onBack={() => navigateTo('dashboard')}
            onNavigateToGallery={(slug) => navigateTo('public-gallery', { slug })}
          />
        )}
      </main>

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Event"
        maxWidth="500px"
      >
        <CreateEventModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onEventCreated={(newEvent) => {
            handleSelectEvent(newEvent.id || newEvent._id);
          }}
        />
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
