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
      {destinations.length === 0 && <p style={{ color: '#888' }}>No destinations yet. Add one above!</p>}
      {destinations.map(dest => (
        <div key={dest.id} className="destination-card">
          {editing?.id === dest.id ? (
            <DestinationForm existing={dest} onDone={() => setEditing(null)} />
          ) : (
            <>
              <div className="card-header">
                {dest.flag_url && (
                  <img src={dest.flag_url} alt={`${dest.country} flag`} />
                )}
                <h3>{dest.name}, {dest.country}</h3>
              </div>
              {(dest.capital || dest.currency) && (
                <p className="card-meta">
                  {dest.capital && <>Capital: <strong>{dest.capital}</strong></>}
                  {dest.capital && dest.currency && ' · '}
                  {dest.currency && <>Currency: <strong>{dest.currency}</strong></>}
                </p>
              )}
              <span className={`status-badge status-${dest.status}`}>{dest.status}</span>
              {dest.notes && <p className="card-notes">📝 {dest.notes}</p>}
              <p className="card-date">Added: {new Date(dest.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              <div className="card-actions">
                <button className="btn-edit" onClick={() => setEditing(dest)}>Edit</button>
                <button className="btn-delete" onClick={() => deleteDestination(dest.id)}>Delete</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default DestinationList;