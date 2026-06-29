import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.push('Account created. Add a trusted contact to get the most from SafeHer.', 'success');
      navigate('/contacts');
    } catch (err) {
      toast.push(err?.response?.data?.detail || 'Could not create account.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="glow-orb" style={{ width: 280, height: 280, background: '#3FA796', top: -80, right: -80 }} />
        <div className="glow-orb" style={{ width: 220, height: 220, background: '#E94B5C', bottom: -60, left: -60 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="brand"><span className="brand-dot" /> SafeHer</div>
          <div className="brand-sub">Safer routes. Faster help.</div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 26, lineHeight: 1.35, maxWidth: 380 }}>
            Three steps: add trusted contacts, plan your route, start a monitored trip.
          </p>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="eyebrow">Get started</div>
          <h1 className="auth-title">Create your account</h1>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Full name</label>
              <input required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="Priya Sharma" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Phone number</label>
              <input required value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="9876543210" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" required minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="At least 6 characters" />
            </div>
            <button className="btn btn-primary btn-block" disabled={loading} type="submit">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="text-muted" style={{ marginTop: 18, textAlign: 'center' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--color-accent-rose)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
