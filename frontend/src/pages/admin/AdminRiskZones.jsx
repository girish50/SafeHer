import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import { adminApi } from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';
import RiskBadge from '../../components/RiskBadge.jsx';

const DEFAULT_CENTER = [17.4220, 78.4620];
const EMPTY_FORM = { zone_name: '', latitude: '', longitude: '', radius: 300, risk_level: 'moderate', crime_score: 50, night_risk_score: 50, isolation_score: 50 };
const ZONE_COLORS = { high: '#E94B5C', moderate: '#E8A33D', low: '#3FA796' };

export default function AdminRiskZones() {
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const toast = useToast();

  async function load() { const r = await adminApi.get('/api/admin/risk-zones'); setZones(r.data); }
  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY_FORM); setEditing(null); setShowModal(true); }
  function openEdit(z) { setForm({ zone_name: z.zone_name, latitude: z.latitude, longitude: z.longitude, radius: z.radius, risk_level: z.risk_level, crime_score: z.crime_score, night_risk_score: z.night_risk_score, isolation_score: z.isolation_score }); setEditing(z.zone_id); setShowModal(true); }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude), radius: Number(form.radius), crime_score: Number(form.crime_score), night_risk_score: Number(form.night_risk_score), isolation_score: Number(form.isolation_score) };
      if (editing) await adminApi.put(`/api/admin/risk-zones/${editing}`, payload);
      else await adminApi.post('/api/admin/risk-zones', payload);
      toast.push(editing ? 'Zone updated.' : 'Zone added.', 'success');
      setShowModal(false); load();
    } catch (err) { toast.push(err?.response?.data?.detail || 'Could not save zone.', 'error'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try { await adminApi.delete(`/api/admin/risk-zones/${id}`); toast.push('Zone deleted.', 'success'); load(); }
    catch { toast.push('Could not delete zone.', 'error'); }
    finally { setDeleting(null); }
  }

  function upd(field, val) { setForm((f) => ({ ...f, [field]: val })); }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Admin · Risk data</div>
        <h1 className="page-title">Risk zones</h1>
        <p className="page-subtitle">Manage the geographic risk zones used by the route scoring engine. Higher crime, isolation, and night-risk scores increase the overall risk score for routes passing through a zone.</p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={openAdd}>+ Add risk zone</button>
      </div>

      <div className="grid-2">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: 420, width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
            {zones.map((z) => (
              <Circle key={z.zone_id} center={[z.latitude, z.longitude]} radius={z.radius}
                pathOptions={{ color: ZONE_COLORS[z.risk_level] || '#888', fillColor: ZONE_COLORS[z.risk_level] || '#888', fillOpacity: 0.25 }}>
                <Popup><strong>{z.zone_name}</strong><br />{z.risk_level} risk · Crime {z.crime_score}</Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>All zones ({zones.length})</h3>
          <table>
            <thead><tr><th>Name</th><th>Risk</th><th>Crime</th><th>Night</th><th>Radius</th><th></th></tr></thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.zone_id}>
                  <td>{z.zone_name}</td>
                  <td><RiskBadge level={z.risk_level} /></td>
                  <td>{z.crime_score}</td>
                  <td>{z.night_risk_score}</td>
                  <td>{z.radius}m</td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => openEdit(z)}>Edit</button>
                    <button className="btn btn-ghost" style={{ color: 'var(--color-accent-rose)' }} onClick={() => handleDelete(z.zone_id)} disabled={deleting === z.zone_id}>{deleting === z.zone_id ? '…' : 'Del'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{editing ? 'Edit risk zone' : 'Add risk zone'}</h3>
            <div className="grid-2">
              <div className="field"><label>Zone name</label><input value={form.zone_name} onChange={(e) => upd('zone_name', e.target.value)} /></div>
              <div className="field"><label>Risk level</label>
                <select value={form.risk_level} onChange={(e) => upd('risk_level', e.target.value)}>
                  <option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option>
                </select>
              </div>
              <div className="field"><label>Latitude</label><input type="number" step="any" value={form.latitude} onChange={(e) => upd('latitude', e.target.value)} /></div>
              <div className="field"><label>Longitude</label><input type="number" step="any" value={form.longitude} onChange={(e) => upd('longitude', e.target.value)} /></div>
              <div className="field"><label>Radius (metres)</label><input type="number" value={form.radius} onChange={(e) => upd('radius', e.target.value)} /></div>
              <div className="field"><label>Crime score (0–100)</label><input type="number" min="0" max="100" value={form.crime_score} onChange={(e) => upd('crime_score', e.target.value)} /></div>
              <div className="field"><label>Night risk score (0–100)</label><input type="number" min="0" max="100" value={form.night_risk_score} onChange={(e) => upd('night_risk_score', e.target.value)} /></div>
              <div className="field"><label>Isolation score (0–100)</label><input type="number" min="0" max="100" value={form.isolation_score} onChange={(e) => upd('isolation_score', e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button className="btn btn-outline btn-block" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update zone' : 'Add zone'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
