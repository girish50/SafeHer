import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import RiskBadge from '../components/RiskBadge.jsx';

export default function TripHistory() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/trips').then((r) => { setTrips(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="text-muted">Loading trip history…</div>;

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">History</div>
        <h1 className="page-title">Trip history</h1>
        <p className="page-subtitle">All your trips with their route risk scores and status.</p>
      </div>

      {trips.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">🗺</div>
          <p>No trips yet. <button className="btn btn-primary" onClick={() => navigate('/plan')}>Plan your first trip</button></p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>From → To</th>
                <th>Route selected</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Alert?</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => {
                const selected = trip.routes.find((r) => r.route_id === trip.selected_route_id) || trip.routes[0];
                return (
                  <tr key={trip.trip_id}>
                    <td>{new Date(trip.created_at).toLocaleDateString()}</td>
                    <td>{trip.source_text} → {trip.destination_text}</td>
                    <td>{selected?.route_name || '—'}</td>
                    <td>{selected ? <RiskBadge level={selected.risk_level} /> : '—'}</td>
                    <td>
                      <span className={`badge ${trip.trip_status === 'completed' ? 'badge-low' : trip.trip_status === 'alerted' ? 'badge-high' : 'badge-moderate'}`}>
                        {trip.trip_status}
                      </span>
                    </td>
                    <td>{trip.trip_status === 'alerted' ? '⚠ Yes' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
