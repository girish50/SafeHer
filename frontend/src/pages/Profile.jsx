import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    home_location: user?.home_location || '',
    emergency_message_template: user?.emergency_message_template || '',
    preferred_alert_mode: user?.preferred_alert_mode || 'sms_email',
  });
  const [saving, setSaving] = useState(false);

  function update(field, val) { setForm((f) => ({ ...f, [field]: val })); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/auth/me', form);
      await refreshUser();
      toast.push('Profile saved.', 'success');
    } catch {
      toast.push('Could not save profile.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Your account</div>
        <h1 className="page-title">Profile & preferences</h1>
        <p className="page-subtitle">Update your personal info and the emergency message that gets sent to trusted contacts when an alert is triggered.</p>
      </div>

      <div style={{ maxWidth: 560 }}>
        <div className="card">
          <form onSubmit={handleSave}>
            <div className="field">
              <label>Full name</label>
              <input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
            </div>
            <div className="field">
              <label>Phone number</label>
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div className="field">
              <label>Home address / location</label>
              <input placeholder="e.g. 42 Park Street, Hyderabad" value={form.home_location} onChange={(e) => update('home_location', e.target.value)} />
            </div>
            <div className="field">
              <label>Emergency message template</label>
              <textarea rows={3} value={form.emergency_message_template} onChange={(e) => update('emergency_message_template', e.target.value)} />
              <span className="text-muted" style={{ fontSize: 12 }}>Sent automatically with your location when an alert fires. Keep it clear and concise.</span>
            </div>
            <div className="field">
              <label>Preferred alert mode</label>
              <select value={form.preferred_alert_mode} onChange={(e) => update('preferred_alert_mode', e.target.value)}>
                <option value="sms_email">SMS + Email</option>
                <option value="sms">SMS only</option>
                <option value="email">Email only</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <h3 style={{ marginTop: 0 }}>Account info</h3>
          <p className="text-muted">Email: <strong>{user?.email}</strong> (cannot be changed)</p>
          <p className="text-muted">Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</p>
        </div>
      </div>
    </div>
  );
}
