import { DestinationProvider } from './context/DestinationContext';
import DestinationForm from './components/DestinationForm';
import DestinationList from './components/DestinationList';

function App() {
  return (
    <DestinationProvider>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>✈️ Travel Wishlist</h1>
        <h2 style={{ marginBottom: '12px', fontSize: '18px' }}>Add New Destination</h2>
        <DestinationForm />
        <h2 style={{ margin: '32px 0 12px', fontSize: '18px' }}>My Destinations</h2>
        <DestinationList />
      </div>
    </DestinationProvider>
  );
}

export default App;