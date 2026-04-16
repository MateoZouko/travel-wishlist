import { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { DestinationProvider } from './context/DestinationContext';
import { useDestinations } from './context/DestinationContext';
import DestinationForm from './components/DestinationForm';
import DestinationList from './components/DestinationList';
import MapView from './components/MapView';

const AppContent = () => {
  const { destinations } = useDestinations();
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>
      <div className="app-header">
        <h1 style={{ margin: 0, fontSize: '28px' }}>✈️ Travel Wishlist</h1>
        <div className="header-controls">
          <div className="view-toggle">
            <button
              className={`view-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >☰ List</button>
            <button
              className={`view-btn ${view === 'map' ? 'active' : ''}`}
              onClick={() => setView('map')}
            >🗺 Map</button>
          </div>
          <DarkModeToggle />
        </div>
      </div>

      {view === 'list' ? (
        <>
          <h2 style={{ marginBottom: '12px', fontSize: '18px' }}>Add New Destination</h2>
          <DestinationForm />
          <h2 style={{ margin: '32px 0 12px', fontSize: '18px' }}>My Destinations</h2>
          <DestinationList />
        </>
      ) : (
        <>
          <h2 style={{ margin: '24px 0 12px', fontSize: '18px' }}>Map View</h2>
          <MapView destinations={destinations} />
        </>
      )}
    </div>
  );
};

const DarkModeToggle = () => {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button className="dark-toggle" onClick={() => setDark(d => !d)} title="Toggle dark mode">
      {dark ? '☀️' : '🌙'}
    </button>
  );
};

function App() {
  return (
    <ToastProvider>
      <DestinationProvider>
        <AppContent />
      </DestinationProvider>
    </ToastProvider>
  );
}

export default App;
