import React, { useState } from 'react';
import { useDestinations } from '../context/DestinationContext';
import { Destination } from '../types';

interface Props {
  existing?: Destination;
  onDone?: () => void;
}

const DestinationForm: React.FC<Props> = ({ existing, onDone }) => {
  const { addDestination, updateDestination } = useDestinations();
  const [name, setName] = useState(existing?.name || '');
  const [country, setCountry] = useState(existing?.country || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [status, setStatus] = useState<Destination['status']>(existing?.status || 'wishlist');

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (existing) {
      await updateDestination(existing.id, { name, country, notes, status });
    } else {
      await addDestination({ name, country, notes, status });
    }
    setName('');
    setCountry('');
    setNotes('');
    setStatus('wishlist');
    onDone?.();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
      <input
        placeholder="Destination name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        placeholder="Country"
        value={country}
        onChange={e => setCountry(e.target.value)}
        required
      />
      <textarea
        placeholder="Notes"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      <select value={status} onChange={e => setStatus(e.target.value as Destination['status'])}>
        <option value="wishlist">Wishlist</option>
        <option value="planned">Planned</option>
        <option value="visited">Visited</option>
      </select>
      <button type="submit">{existing ? 'Update' : 'Add Destination'}</button>
    </form>
  );
};

export default DestinationForm;