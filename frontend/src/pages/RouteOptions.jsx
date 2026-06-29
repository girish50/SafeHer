import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import api from '../api/client';
import RiskBadge from '../components/RiskBadge.jsx';
import RiskDial from '../components/RiskDial.jsx';
import { useToast } from '../context/ToastContext.jsx';

const ROUTE_COLORS = ['#1B2A4A', '#3FA796', '#E8A33D'];

export default function RouteOptions() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    api.get(`/api/trips/${tripId}`).then((res) => {
      setTrip(res.data);
      const recommended = res.data.routes.find((r) => r.is_selected) || res.data.routes[0];
      setSelectedRouteId(recommended?.route_id);
    });
  }, [tripId]);

  async function handleStart() {
    setStarting(true);
    try {
      await api.post(`/api/trips/${tripId}/start`, { route_id: selectedRouteId });
      navigate(`/trip/${tripId}`);
    } catch (err) {
      toast.push(err?.response?.data?.detail || 'Could not start trip.', 'error');
    } finally {
      setStarting(false);
    }
  }

  if (!trip) return <div className="text-muted">Loading route options…</div>;

  const routes = trip.routes.map((r) => ({ ...r, geometry: JSON.parse(r.route_geometry), breakdown: r.risk_breakdown ? JSON.parse(r.risk_breakdown) : null }));
  const recommended = routes.find((r) => r.is_selected);
  const center = routes[0]?.geometry[1] || [trip.source_lat, trip.source_lng];

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Step 2 of 3</div>
        <h1 className="page-title">Choose your route</h1>
        <p className="page-subtitle">
          {trip.source_text} → {trip.destination_text}. Each route is scored 0–100 on risky-zone overlap, time of
          travel, isolation, nearby help points, and exposure duration.
        </p>
      </div>

      <div className="grid-2">
        <div>
          {recommended && (
            <div className="alert-banner" style={{ background: 'rgba(63,167,150,0.1)', borderColor: 'rgba(63,167,150,0.35)', color: '#1F7768' }}>
              ✓ {recommended.route_name} is the recommended safer route for this trip.
            </div>
          )}
          {routes.map((route, idx) => (
            <div
              key={route.route_id}
              className={`route-card ${selectedRouteId === route.route_id ? 'selected' : ''}`}
              onClick={() => setSelectedRouteId(route.route_id)}
              style={{ borderLeft: `4px solid ${ROUTE_COLORS[idx % 3]}` }}
            >
              <div className="route-card-top">
                <strong>{route.route_name}</strong>
                <RiskBadge level={route.risk_level} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <RiskDial score={route.risk_score} level={route.risk_level} size={84} />
                <div className="kpi-row">
                  <div className="kpi">
                    <div className="kpi-value">{route.distance_km}</div>
                    <div className="kpi-label">km</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-value">{route.eta_minutes}</div>
                    <div className="kpi-label">min ETA</div>
                  </div>
                </div>
              </div>
              {route.breakdown && (
                <div className="text-muted" style={{ marginTop: 10, fontSize: 12.5 }}>
                  {route.breakdown.zones_crossed} risk zone(s) crossed · {route.breakdown.support_points_nearby} support point(s) nearby
                </div>
              )}
            </div>
          ))}
          <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={handleStart} disabled={starting || !selectedRouteId}>
            {starting ? 'Starting trip…' : 'Start Safe Trip'}
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <MapContainer center={center} zoom={13} style={{ height: 500, width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
            {routes.map((route, idx) => (
              <Polyline
                key={route.route_id}
                positions={route.geometry}
                pathOptions={{
                  color: ROUTE_COLORS[idx % 3],
                  weight: selectedRouteId === route.route_id ? 6 : 3,
                  opacity: selectedRouteId === route.route_id ? 0.95 : 0.45,
                }}
                eventHandlers={{ click: () => setSelectedRouteId(route.route_id) }}
              />
            ))}
            <Marker position={[trip.source_lat, trip.source_lng]} />
            <Marker position={[trip.dest_lat, trip.dest_lng]} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
