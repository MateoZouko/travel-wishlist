import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ISSPosition } from '../types';

const ISSTracker: React.FC = () => {
  const [position, setPosition] = useState<ISSPosition | null>(null);

  const fetchISS = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/iss');
      setPosition(res.data);
    } catch (err) {
      console.error('Error fetching ISS position:', err);
    }
  };

  useEffect(() => {
    fetchISS();
    const interval = setInterval(fetchISS, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!position) return <p>Loading ISS position...</p>;

  return (
    <div style={{ border: '1px solid #4a90e2', padding: '12px', borderRadius: '4px', marginBottom: '24px' }}>
      <h2>🛸 ISS Live Position</h2>
      <p>Latitude: <strong>{position.latitude.toFixed(4)}</strong></p>
      <p>Longitude: <strong>{position.longitude.toFixed(4)}</strong></p>
      <p style={{ fontSize: '12px', color: '#888' }}>
        Updated: {new Date(position.timestamp * 1000).toLocaleTimeString()}
      </p>
    </div>
  );
};

export default ISSTracker;