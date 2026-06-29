import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/client';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminApi.post('/api/admin/login', { email, password });
      localStorage.setItem('safeher_admin_token', res.data.access_token);
      localStorage.setItem('safeher_admin', JSON.stringify(res.data.admin));
      navigate('/admin/dashboard');
    } catch {
      toast.push('Invalid admin credentials.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="glow-orb" style={{ width: 300, height: 300, background: '#1B2A4A', top: -80, right: -80, opacity: 0.8 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="brand"><span className="brand-dot" /> SafeHer Admin</div>
          <div className="brand-sub">Risk data &amp; safety operations</div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 26, lineHeight: 1.35, maxWidth: 380 }}>
            Manage risk zones, emergency support points, and monitor system alerts.
          </p>
          <p style={{ color: '#9AA4BD', fontSize: 12.5, marginTop: 16 }}>Demo credentials: admin@safeher.demo / Admin@12345</p>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="eyebrow">Admin portal</div>
          <h1 className="auth-title">Admin sign in</h1>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@safeher.demo" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in as Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
