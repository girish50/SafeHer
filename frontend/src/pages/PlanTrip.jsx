import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/client';
import { useToast } from '../context/ToastContext.jsx';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [17.4220, 78.4620]; // demo city center matching seeded risk-zone data

function ClickCapture({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function PlanTrip() {
  const [sourceText, setSourceText] = useState('');
  const [destText, setDestText] = useState('');
  const [source, setSource] = useState(null);
  const [dest, setDest] = useState(null);
  const [pickMode, setPickMode] = useState('source');
  const [travelHour, setTravelHour] = useState(new Date().getHours());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  function handlePick(latlng) {
    if (pickMode === 'source') {
      setSource(latlng);
      if (!sourceText) setSourceText(`Pinned location (${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)})`);
      setPickMode('destination');
    } else {
      setDest(latlng);
      if (!destText) setDestText(`Pinned location (${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)})`);
    }
  }

  async function handlePlan(e) {
    e.preventDefault();
    if (!source || !dest) {
      toast.push('Tap the map to set both a source and destination point.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/trips/plan', {
        source_text: sourceText || 'Source',
        destination_text: destText || 'Destination',
        source_lat: source[0],
        source_lng: source[1],
        dest_lat: dest[0],
        dest_lng: dest[1],
        travel_hour: Number(travelHour),
      });
      navigate(`/routes/${res.data.trip_id}`);
    } catch (err) {
      toast.push(err?.response?.data?.detail || 'Could not plan route.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Step 1 of 3</div>
        <h1 className="page-title">Plan a safer trip</h1>
        <p className="page-subtitle">
          Tap the map to drop a source pin, then a destination pin. We'll compare route options on a 0–100
          risk score, not just distance.
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <form onSubmit={handlePlan}>
            <div className="field">
              <label>Source {pickMode === 'source' && <span style={{ color: 'var(--color-accent-rose)' }}>(tap map to set)</span>}</label>
              <input value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="e.g. College Main Gate" />
            </div>
            <div className="field">
              <label>Destination {pickMode === 'destination' && <span style={{ color: 'var(--color-accent-rose)' }}>(tap map to set)</span>}</label>
              <input value={destText} onChange={(e) => setDestText(e.target.value)} placeholder="e.g. Home" />
            </div>
            <div className="field">
              <label>Travel time (hour of day, 0–23)</label>
              <input type="number" min="0" max="23" value={travelHour} onChange={(e) => setTravelHour(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button type="button" className={`btn ${pickMode === 'source' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPickMode('source')}>
                Set source
              </button>
              <button type="button" className={`btn ${pickMode === 'destination' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPickMode('destination')}>
                Set destination
              </button>
            </div>
            <button className="btn btn-rose btn-block" type="submit" disabled={loading}>
              {loading ? 'Scoring routes…' : 'Compare route options'}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: 460, width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <ClickCapture onPick={handlePick} />
            {source && <Marker position={source} />}
            {dest && <Marker position={dest} />}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
