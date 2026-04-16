import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Destination } from '../types';

interface Props {
  destinations: Destination[];
}

interface Coords {
  [country: string]: [number, number];
}

const STATUS_COLORS: Record<string, string> = {
  wishlist: '#1a73e8',
  planned:  '#e65c00',
  visited:  '#2e7d32',
};

const FlyTo: React.FC<{ position: [number, number] | null }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 5, { duration: 1 });
  }, [position, map]);
  return null;
};

const MapView: React.FC<Props> = ({ destinations }) => {
  const [coords, setCoords]       = useState<Coords>({});
  const [selected, setSelected]   = useState<number | null>(null);
  const [flyTo, setFlyTo]         = useState<[number, number] | null>(null);
  const [isDark, setIsDark]       = useState(document.documentElement.getAttribute('data-theme') === 'dark');
  const panelRef                  = useRef<HTMLDivElement>(null);

  // Sync dark mode with map tiles
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Fetch coordinates from RestCountries
  useEffect(() => {
    const unique = Array.from(new Set(destinations.map(d => d.country)));
    unique.filter(c => !coords[c]).forEach(async country => {
      try {
        const res  = await fetch(`https://restcountries.com/v3.1/name/${country}?fields=name,latlng`);
        const data = await res.json();
        if (data[0]?.latlng) setCoords(prev => ({ ...prev, [country]: data[0].latlng }));
      } catch {}
    });
  }, [destinations]);

  const handlePinClick = (dest: Destination) => {
    setSelected(dest.id);
    const pos = coords[dest.country];
    if (pos) setFlyTo(pos);
    // Scroll panel to selected card
    setTimeout(() => {
      panelRef.current?.querySelector(`[data-id="${dest.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handleCardClick = (dest: Destination) => {
    setSelected(dest.id);
    const pos = coords[dest.country];
    if (pos) setFlyTo(pos);
  };

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="map-layout">
      {/* Map */}
      <div className="map-box">
        <MapContainer center={[20, 0]} zoom={2} className="map-container" scrollWheelZoom={false}>
          <TileLayer url={tileUrl} attribution='&copy; <a href="https://carto.com">CARTO</a>' />
          <FlyTo position={flyTo} />
          {destinations.map(dest => {
            const pos = coords[dest.country];
            if (!pos) return null;
            const isSelected = selected === dest.id;
            return (
              <CircleMarker
                key={dest.id}
                center={pos}
                radius={isSelected ? 14 : 10}
                pathOptions={{
                  color: '#fff',
                  weight: isSelected ? 3 : 2,
                  fillColor: STATUS_COLORS[dest.status],
                  fillOpacity: isSelected ? 1 : 0.85,
                }}
                eventHandlers={{ click: () => handlePinClick(dest) }}
              >
                <Popup>
                  <div style={{ minWidth: '150px' }}>
                    {dest.flag_url && <img src={dest.flag_url} alt="" style={{ width: '40px', marginBottom: '6px', borderRadius: '2px' }} />}
                    <strong style={{ display: 'block', fontSize: '14px' }}>{dest.name}, {dest.country}</strong>
                    {dest.capital && <span style={{ fontSize: '12px', color: '#666' }}>Capital: {dest.capital}</span>}
                    <br />
                    <span style={{
                      display: 'inline-block', marginTop: '6px',
                      padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                      background: dest.status === 'visited' ? '#e6f4ea' : dest.status === 'planned' ? '#fff3e0' : '#e8f0fe',
                      color: STATUS_COLORS[dest.status],
                    }}>{dest.status}</span>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="map-legend">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <span key={status} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          ))}
        </div>
      </div>

      {/* Side panel */}
      <div className="map-panel" ref={panelRef}>
        <p className="panel-title">{destinations.length} destination{destinations.length !== 1 ? 's' : ''}</p>
        {destinations.length === 0 && <p className="panel-empty">No destinations yet.</p>}
        {destinations.map(dest => (
          <div
            key={dest.id}
            data-id={dest.id}
            className={`panel-card ${selected === dest.id ? 'panel-card-active' : ''}`}
            onClick={() => handleCardClick(dest)}
          >
            <div className="panel-card-header">
              {dest.flag_url && <img src={dest.flag_url} alt="" className="panel-flag" />}
              <div>
                <strong className="panel-name">{dest.name}</strong>
                <span className="panel-country">{dest.country}</span>
              </div>
            </div>
            <span className={`status-badge status-${dest.status}`}>{dest.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapView;
