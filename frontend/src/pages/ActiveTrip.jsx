import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, CircleMarker } from 'react-leaflet';
import api from '../api/client';
import RiskBadge from '../components/RiskBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';

const SAFETY_CHECK_TIMEOUT_SEC = 15;

export default function ActiveTrip() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [events, setEvents] = useState([]);
  const [livePos, setLivePos] = useState(null);
  const [simIndex, setSimIndex] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [safetyPrompt, setSafetyPrompt] = useState(null); // {description}
  const [countdown, setCountdown] = useState(SAFETY_CHECK_TIMEOUT_SEC);
  const [sosSending, setSosSending] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const countdownRef = useRef(null);

  const loadTrip = useCallback(async () => {
    const res = await api.get(`/api/trips/${tripId}`);
    setTrip(res.data);
    if (res.data.trip_status === 'completed') navigate('/history');
  }, [tripId, navigate]);

  const loadEvents = useCallback(async () => {
    const res = await api.get(`/api/trips/${tripId}/events`);
    setEvents(res.data);
  }, [tripId]);

  useEffect(() => {
    loadTrip();
    loadEvents();
  }, [loadTrip, loadEvents]);

  const selectedRoute = trip?.routes.find((r) => r.route_id === trip.selected_route_id);
  const geometry = selectedRoute ? JSON.parse(selectedRoute.route_geometry) : null;

  // Build a finely interpolated path for smooth simulated movement
  const densePath = useRef([]);
  useEffect(() => {
    if (!geometry) return;
    const dense = [];
    for (let i = 0; i < geometry.length - 1; i++) {
      const [lat1, lng1] = geometry[i];
      const [lat2, lng2] = geometry[i + 1];
      for (let t = 0; t <= 1; t += 0.04) {
        dense.push([lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t]);
      }
    }
    densePath.current = dense;
  }, [selectedRoute?.route_id]);

  const sendTrackingPoint = useCallback(
    async (lat, lng) => {
      try {
        const res = await api.post(`/api/trips/${tripId}/track`, { latitude: lat, longitude: lng });
        if (res.data.deviation_detected) {
          setSafetyPrompt('You are off the selected route. Are you safe?');
        } else if (res.data.prolonged_stop_detected) {
          setSafetyPrompt("You've been stationary for a while. Are you safe?");
        }
        loadEvents();
      } catch (err) {
        // tracking errors shouldn't break the UI loop
      }
    },
    [tripId, loadEvents]
  );

  // Simulated movement loop (for demo purposes - drives the point along the chosen route,
  // with a deliberate detour partway through so deviation detection can be demonstrated)
  useEffect(() => {
    if (!simulating || !densePath.current.length) return;
    const interval = setInterval(() => {
      setSimIndex((idx) => {
        const path = densePath.current;
        let nextIdx = idx + 1;
        if (nextIdx >= path.length) {
          setSimulating(false);
          return idx;
        }
        let [lat, lng] = path[nextIdx];
        // inject a deviation around 40% through the trip for demo purposes
        if (nextIdx === Math.floor(path.length * 0.4)) {
          lat += 0.006;
          lng += 0.006;
        }
        setLivePos([lat, lng]);
        sendTrackingPoint(lat, lng);
        return nextIdx;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [simulating, sendTrackingPoint]);

  // Safety prompt countdown -> auto trigger alert if no response
  useEffect(() => {
    if (!safetyPrompt) {
      clearInterval(countdownRef.current);
      setCountdown(SAFETY_CHECK_TIMEOUT_SEC);
      return;
    }
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownRef.current);
          handleSafetyResponse(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safetyPrompt]);

  async function handleSafetyResponse(isSafe) {
    setSafetyPrompt(null);
    try {
      const res = await api.post(`/api/trips/${tripId}/safety-check`, { is_safe: isSafe });
      if (res.data.status === 'alert_triggered') {
        toast.push('No confirmation received — emergency alert sent to trusted contacts.', 'error');
        setSimulating(false);
        loadTrip();
      } else {
        toast.push('Marked as safe. Continuing trip.', 'success');
      }
      loadEvents();
    } catch (err) {
      toast.push('Could not record safety response.', 'error');
    }
  }

  async function handleSOS() {
    setSosSending(true);
    try {
      const pos = livePos || (geometry ? geometry[0] : [trip.source_lat, trip.source_lng]);
      await api.post('/api/alerts/sos', {
        latitude: pos[0],
        longitude: pos[1],
        trip_id: Number(tripId),
      });
      toast.push('SOS sent. Trusted contacts have been notified with your location.', 'error');
      setSimulating(false);
      loadTrip();
    } catch (err) {
      toast.push(err?.response?.data?.detail || 'Could not send SOS.', 'error');
    } finally {
      setSosSending(false);
    }
  }

  async function handleEndTrip() {
    await api.post(`/api/trips/${tripId}/end`);
    toast.push('Trip ended safely.', 'success');
    navigate('/history');
  }

  if (!trip || !selectedRoute) return <div className="text-muted">Loading trip…</div>;

  const currentMarker = livePos || geometry[0];

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Step 3 of 3 · Active Trip</div>
        <h1 className="page-title">Trip in progress</h1>
        <p className="page-subtitle">
          {trip.source_text} → {trip.destination_text} on {selectedRoute.route_name} <RiskBadge level={selectedRoute.risk_level} />
        </p>
      </div>

      {trip.trip_status === 'alerted' && (
        <div className="alert-banner">⚠ An emergency alert has been triggered for this trip. Trusted contacts were notified.</div>
      )}

      <div className="grid-2">
        <div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Trip controls</h3>
            <p className="text-muted">
              No physical GPS movement needed to test this demo — use "Simulate live movement" to walk the
              pin along the planned route, including a deliberate detour so you can see deviation detection fire.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <button className="btn btn-outline" onClick={() => setSimulating((s) => !s)} disabled={trip.trip_status !== 'active'}>
                {simulating ? 'Pause simulation' : 'Simulate live movement'}
              </button>
              <button className="btn btn-outline" onClick={handleEndTrip}>
                End trip (arrived safely)
              </button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Trip events</h3>
            {events.length === 0 ? (
              <p className="text-muted">No events yet. Events like route deviation or prolonged stops will appear here.</p>
            ) : (
              <table>
                <thead>
                  <tr><th>Type</th><th>Description</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.event_id}>
                      <td>{e.event_type.replace(/_/g, ' ')}</td>
                      <td>{e.event_description}</td>
                      <td>{new Date(e.event_time).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <MapContainer center={currentMarker} zoom={14} style={{ height: 520, width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
            <Polyline positions={geometry} pathOptions={{ color: '#1B2A4A', weight: 5, opacity: 0.6 }} />
            <Marker position={[trip.source_lat, trip.source_lng]} />
            <Marker position={[trip.dest_lat, trip.dest_lng]} />
            <CircleMarker center={currentMarker} radius={9} pathOptions={{ color: '#E94B5C', fillColor: '#E94B5C', fillOpacity: 0.9 }} />
          </MapContainer>
        </div>
      </div>

      <button className="sos-fab" onClick={handleSOS} disabled={sosSending}>
        {sosSending ? '…' : 'SOS'}
      </button>

      {safetyPrompt && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginTop: 0 }}>Safety check</h3>
            <p>{safetyPrompt}</p>
            <p className="text-muted">Auto-alert in {countdown}s if no response.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-outline btn-block" onClick={() => handleSafetyResponse(true)}>I am safe</button>
              <button className="btn btn-rose btn-block" onClick={() => handleSafetyResponse(false)}>Send help</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
