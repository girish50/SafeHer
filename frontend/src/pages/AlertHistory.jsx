import { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext.jsx';

const TYPE_LABEL = {
  manual_sos: 'Manual SOS',
  auto_deviation: 'Auto – Route deviation',
  auto_prolonged_stop: 'Auto – Prolonged stop',
  auto_no_response: 'Auto – No response',
};

export default function AlertHistory() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  const toast = useToast();

  async function load() {
    const r = await api.get('/api/alerts');
    setAlerts(r.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function resolve(alertId) {
    setResolving(alertId);
    try {
      await api.post(`/api/alerts/${alertId}/resolve`);
      toast.push('Alert marked as resolved.', 'success');
      load();
    } catch {
      toast.push('Could not resolve alert.', 'error');
    } finally {
      setResolving(null);
    }
  }

  if (loading) return <div className="text-muted">Loading alerts…</div>;

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Safety record</div>
        <h1 className="page-title">Alert history</h1>
        <p className="page-subtitle">All SOS and auto-triggered alerts. Active alerts can be resolved once you're confirmed safe.</p>
      </div>

      {alerts.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">✅</div>
          <p>No alerts on record — all your trips have been safe.</p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Triggered</th>
                <th>Type</th>
                <th>Status</th>
                <th>Location</th>
                <th>Contacts notified</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.alert_id}>
                  <td>{new Date(a.triggered_at).toLocaleString()}</td>
                  <td>{TYPE_LABEL[a.alert_type] || a.alert_type}</td>
                  <td>
                    <span className={`badge ${a.alert_status === 'active' ? 'badge-high' : 'badge-low'}`}>
                      {a.alert_status}
                    </span>
                  </td>
                  <td>
                    {a.latitude
                      ? <a href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`} target="_blank" rel="noreferrer">View map ↗</a>
                      : '—'}
                  </td>
                  <td>{a.recipients?.length || 0} contact(s)</td>
                  <td>
                    {a.alert_status === 'active' && (
                      <button className="btn btn-outline btn-ghost" onClick={() => resolve(a.alert_id)} disabled={resolving === a.alert_id}>
                        {resolving === a.alert_id ? '…' : 'Mark resolved'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
