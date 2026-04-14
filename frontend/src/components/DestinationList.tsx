import React, { useState } from 'react';
import { useDestinations } from '../context/DestinationContext';
import DestinationForm from './DestinationForm';
import { Destination } from '../types';

const DestinationList: React.FC = () => {
  const { destinations, deleteDestination, loading } = useDestinations();
  const [editing, setEditing] = useState<Destination | null>(null);

  if (loading) return <p>Loading destinations...</p>;

  return (
    <div>
      <h2>My Destinations</h2>
      {destinations.length === 0 && <p>No destinations yet. Add one!</p>}
      {destinations.map(dest => (
        <div key={dest.id} style={{ border: '1px solid #ccc', padding: '12px', marginBottom: '8px', borderRadius: '4px' }}>
          {editing?.id === dest.id ? (
            <DestinationForm existing={dest} onDone={() => setEditing(null)} />
          ) : (
            <>
              <h3>{dest.name}, {dest.country}</h3>
              <p>Status: <strong>{dest.status}</strong></p>
              {dest.notes && <p>Notes: {dest.notes}</p>}
              <p style={{ fontSize: '12px', color: '#888' }}>Added: {new Date(dest.created_at).toLocaleDateString()}</p>
              <button onClick={() => setEditing(dest)}>Edit</button>
              <button onClick={() => deleteDestination(dest.id)} style={{ marginLeft: '8px', color: 'red' }}>Delete</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default DestinationList;