import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';

const TYPE_LABEL = {
  manual_sos: 'Manual SOS',
  auto_deviation: 'Auto – Deviation',
  auto_prolonged_stop: 'Auto – Prolonged stop',
  auto_no_response: 'Auto – No response',
};

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    adminApi.get('/api/admin/alerts').then((r) => { setAlerts(r.data); setLoading(false); });
  }, []);

  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.alert_status === filter);

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Admin · Alert log</div>
        <h1 className="page-title">All system alerts</h1>
        <p className="page-subtitle">All SOS and auto-triggered alerts across all users. Review active alerts and verify resolution.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {['all', 'active', 'resolved'].map((f) => (
          <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
            {f === 'all' ? 'All alerts' : f}
          </button>
        ))}
      </div>

      {loading ? <div className="text-muted">Loading…</div> : filtered.length === 0 ? (
        <div className="card empty-state"><div className="empty-state-icon">✅</div><p>No alerts matching this filter.</p></div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr><th>Alert ID</th><th>Type</th><th>User ID</th><th>Status</th><th>Location</th><th>Triggered</th><th>Contacts</th></tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.alert_id}>
                  <td>#{a.alert_id}</td>
                  <td>{TYPE_LABEL[a.alert_type] || a.alert_type}</td>
                  <td>User #{a.user_id}</td>
                  <td>
                    <span className={`badge ${a.alert_status === 'active' ? 'badge-high' : 'badge-low'}`}>{a.alert_status}</span>
                  </td>
                  <td>
                    {a.latitude
                      ? <a href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`} target="_blank" rel="noreferrer">View ↗</a>
                      : '—'}
                  </td>
                  <td>{new Date(a.triggered_at).toLocaleString()}</td>
                  <td>{a.recipients?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
