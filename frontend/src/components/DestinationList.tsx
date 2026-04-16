import React, { useState } from 'react';
import { useDestinations } from '../context/DestinationContext';
import DestinationForm from './DestinationForm';
import { Destination } from '../types';

type Filter = 'all' | 'wishlist' | 'planned' | 'visited';
type SortKey = 'date' | 'name' | 'status';

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Wishlist', value: 'wishlist' },
  { label: 'Planned', value: 'planned' },
  { label: 'Visited', value: 'visited' },
];

const DestinationList: React.FC = () => {
  const { destinations, deleteDestination, updateDestination, loading } = useDestinations();
  const [editing, setEditing] = useState<Destination | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('date');

  const counts = {
    all: destinations.length,
    wishlist: destinations.filter(d => d.status === 'wishlist').length,
    planned: destinations.filter(d => d.status === 'planned').length,
    visited: destinations.filter(d => d.status === 'visited').length,
  };

  const visitedPct = counts.all === 0 ? 0 : Math.round((counts.visited / counts.all) * 100);

  const markAsVisited = async (dest: Destination) => {
    await updateDestination(dest.id, {
      name: dest.name,
      country: dest.country,
      notes: dest.notes,
      status: 'visited',
      capital: dest.capital,
      currency: dest.currency,
      flag_url: dest.flag_url,
    });
  };

  const filtered = destinations
    .filter(d => filter === 'all' || d.status === filter)
    .filter(d => {
      const q = search.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'status') {
        const order = { wishlist: 0, planned: 1, visited: 2 };
        return order[a.status] - order[b.status];
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (loading) return <p>Loading destinations...</p>;

  return (
    <div>
      {/* Progress bar */}
      {counts.all > 0 && (
        <div className="progress-section">
          <div className="progress-header">
            <span>Places visited</span>
            <span className="progress-pct">{visitedPct}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${visitedPct}%` }} />
          </div>
          <p className="progress-sub">{counts.visited} of {counts.all} destination{counts.all !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat stat-wishlist">
          <span className="stat-number">{counts.wishlist}</span>
          <span className="stat-label">Wishlist</span>
        </div>
        <div className="stat stat-planned">
          <span className="stat-number">{counts.planned}</span>
          <span className="stat-label">Planned</span>
        </div>
        <div className="stat stat-visited">
          <span className="stat-number">{counts.visited}</span>
          <span className="stat-label">Visited</span>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="controls-bar">
        <input
          className="search-input"
          placeholder="Search by name or country..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="sort-select"
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
        >
          <option value="date">Sort: Date</option>
          <option value="name">Sort: Name</option>
          <option value="status">Sort: Status</option>
        </select>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`filter-tab ${filter === f.value ? 'active' : ''} filter-tab-${f.value}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label} {f.value !== 'all' && <span className="tab-count">{counts[f.value]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: '#aaa', marginTop: '16px' }}>
          {search ? `No results for "${search}".` : filter === 'all' ? 'No destinations yet. Add one above!' : `No ${filter} destinations.`}
        </p>
      )}

      {filtered.map(dest => (
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
                {dest.status !== 'visited' && (
                  <button className="btn-visited" onClick={() => markAsVisited(dest)}>✓ Mark as visited</button>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default DestinationList;
