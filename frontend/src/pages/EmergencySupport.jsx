import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import api from '../api/client';

const TYPE_COLOR = { police: '#1B2A4A', hospital: '#E94B5C', pharmacy: '#3FA796', public: '#E8A33D' };
const TYPE_ICON = { police: '🚓', hospital: '🏥', pharmacy: '💊', public: '🏢' };

const DEFAULT_CENTER = [17.4220, 78.4620];

export default function EmergencySupport() {
  const [points, setPoints] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = filter !== 'all' ? `?support_type=${filter}` : '';
    api.get(`/api/support-points${params}`).then((r) => { setPoints(r.data); setLoading(false); });
  }, [filter]);

  const center = points.length > 0 ? [points[0].latitude, points[0].longitude] : DEFAULT_CENTER;

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Safety network</div>
        <h1 className="page-title">Nearby emergency support</h1>
        <p className="page-subtitle">Police stations, hospitals, pharmacies and public safety locations in the safety dataset.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {['all', 'police', 'hospital', 'pharmacy', 'public'].map((t) => (
          <button key={t} className={`btn ${filter === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(t)} style={{ textTransform: 'capitalize' }}>
            {TYPE_ICON[t] || '◎'} {t}
          </button>
        ))}
      </div>

      <div className="grid-2">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <MapContainer center={center} zoom={13} style={{ height: 480, width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
            {points.map((p) => (
              <CircleMarker
                key={p.support_id}
                center={[p.latitude, p.longitude]}
                radius={10}
                pathOptions={{ color: TYPE_COLOR[p.support_type] || '#888', fillColor: TYPE_COLOR[p.support_type] || '#888', fillOpacity: 0.85 }}
              >
                <Popup>
                  <strong>{p.support_name}</strong><br />
                  {TYPE_ICON[p.support_type]} {p.support_type}<br />
                  {p.address}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Support locations ({points.length})</h3>
          {loading ? <p className="text-muted">Loading…</p> : points.length === 0 ? (
            <p className="text-muted">No locations found for this filter.</p>
          ) : (
            <table>
              <thead><tr><th>Name</th><th>Type</th><th>Address</th></tr></thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.support_id}>
                    <td>{TYPE_ICON[p.support_type]} {p.support_name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.support_type}</td>
                    <td>{p.address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
