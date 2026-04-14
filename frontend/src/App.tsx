import React from 'react';
import { DestinationProvider } from './context/DestinationContext';
import DestinationForm from './components/DestinationForm';
import DestinationList from './components/DestinationList';
import ISSTracker from './components/ISSTracker';

function App() {
  return (
    <DestinationProvider>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <h1>✈️ Travel Wishlist</h1>
        <ISSTracker />
        <h2>Add New Destination</h2>
        <DestinationForm />
        <hr style={{ margin: '24px 0' }} />
        <DestinationList />
      </div>
    </DestinationProvider>
  );
}

export default App;