import { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import RiskDial from '../../components/RiskDial.jsx';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    adminApi.get('/api/admin/analytics/summary').then((r) => setSummary(r.data));
  }, []);

  if (!summary) return <div className="text-muted">Loading overview…</div>;

  const dist = summary.route_risk_distribution;
  const totalRoutes = dist.high + dist.moderate + dist.low || 1;

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Admin overview</div>
        <h1 className="page-title">Safety operations dashboard</h1>
        <p className="page-subtitle">Platform-wide metrics: users, trips, alerts, and route risk distribution.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Registered users', value: summary.total_users, icon: '●' },
          { label: 'Total trips', value: summary.total_trips, icon: '◎' },
          { label: 'Total alerts', value: summary.total_alerts, icon: '⚠' },
        ].map((k) => (
          <div className="card" key={k.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{k.icon}</div>
            <div className="kpi-value" style={{ fontSize: 42 }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Active alerts</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="kpi-value" style={{ fontSize: 52, color: summary.active_alerts > 0 ? 'var(--color-accent-rose)' : 'var(--color-safe)' }}>
              {summary.active_alerts}
            </div>
            <div>
              <div className="kpi-label">Unresolved SOS / auto alerts</div>
              <p className="text-muted" style={{ marginTop: 4 }}>
                {summary.active_alerts === 0 ? 'No active alerts. All users are confirmed safe or resolved.' : 'These alerts need admin review.'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Route risk distribution</h3>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { level: 'high', count: dist.high },
                { level: 'moderate', count: dist.moderate },
                { level: 'low', count: dist.low },
              ].map(({ level, count }) => (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`dot dot-${level}`} style={{ width: 12, height: 12 }} />
                  <span style={{ textTransform: 'capitalize', fontSize: 14 }}>{level}</span>
                  <strong>{count}</strong>
                  <span className="text-muted">({Math.round((count / totalRoutes) * 100)}%)</span>
                </div>
              ))}
            </div>
            <RiskDial score={Math.round((dist.high / totalRoutes) * 100)} level="high" size={100} />
          </div>
        </div>
      </div>
    </div>
  );
}
