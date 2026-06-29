import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { adminApi } from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

const DEFAULT_CENTER = [17.4220, 78.4620];
const EMPTY_FORM = { support_type: 'police', support_name: '', latitude: '', longitude: '', address: '' };
const TYPE_COLOR = { police: '#1B2A4A', hospital: '#E94B5C', pharmacy: '#3FA796', public: '#E8A33D' };
const TYPE_ICON = { police: '🚓', hospital: '🏥', pharmacy: '💊', public: '🏢' };

export default function AdminSupportPoints() {
  const [points, setPoints] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const toast = useToast();

  async function load() { const r = await adminApi.get('/api/admin/support-points'); setPoints(r.data); }
  useEffect(() => { load(); }, []);

  function upd(field, val) { setForm((f) => ({ ...f, [field]: val })); }

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.post('/api/admin/support-points', { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) });
      toast.push('Support point added.', 'success'); setShowModal(false); load();
    } catch (err) { toast.push(err?.response?.data?.detail || 'Could not save.', 'error'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try { await adminApi.delete(`/api/admin/support-points/${id}`); toast.push('Point removed.', 'success'); load(); }
    catch { toast.push('Could not delete.', 'error'); }
    finally { setDeleting(null); }
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Admin · Safety infrastructure</div>
        <h1 className="page-title">Emergency support points</h1>
        <p className="page-subtitle">Police stations, hospitals, pharmacies and public safety locations shown to users and factored into route risk scoring.</p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}>+ Add support point</button>
      </div>

      <div className="grid-2">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: 420, width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
            {points.map((p) => (
              <CircleMarker key={p.support_id} center={[p.latitude, p.longitude]} radius={10}
                pathOptions={{ color: TYPE_COLOR[p.support_type] || '#888', fillColor: TYPE_COLOR[p.support_type] || '#888', fillOpacity: 0.9 }}>
                <Popup><strong>{p.support_name}</strong><br />{TYPE_ICON[p.support_type]} {p.support_type}<br />{p.address}</Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>All support points ({points.length})</h3>
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>Address</th><th></th></tr></thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.support_id}>
                  <td>{TYPE_ICON[p.support_type]} {p.support_name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.support_type}</td>
                  <td>{p.address || '—'}</td>
                  <td>
                    <button className="btn btn-ghost" style={{ color: 'var(--color-accent-rose)' }} onClick={() => handleDelete(p.support_id)} disabled={deleting === p.support_id}>{deleting === p.support_id ? '…' : 'Del'}</button>
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
            <h3 style={{ marginTop: 0 }}>Add support point</h3>
            <div className="field"><label>Name</label><input value={form.support_name} onChange={(e) => upd('support_name', e.target.value)} placeholder="City General Hospital" /></div>
            <div className="field"><label>Type</label>
              <select value={form.support_type} onChange={(e) => upd('support_type', e.target.value)}>
                <option value="police">Police</option><option value="hospital">Hospital</option><option value="pharmacy">Pharmacy</option><option value="public">Public</option>
              </select>
            </div>
            <div className="grid-2">
              <div className="field"><label>Latitude</label><input type="number" step="any" value={form.latitude} onChange={(e) => upd('latitude', e.target.value)} /></div>
              <div className="field"><label>Longitude</label><input type="number" step="any" value={form.longitude} onChange={(e) => upd('longitude', e.target.value)} /></div>
            </div>
            <div className="field"><label>Address</label><input value={form.address} onChange={(e) => upd('address', e.target.value)} /></div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button className="btn btn-outline btn-block" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Add point'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
