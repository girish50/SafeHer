import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/plan');
    } catch (err) {
      toast.push(err?.response?.data?.detail || 'Login failed. Check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="glow-orb" style={{ width: 280, height: 280, background: '#E94B5C', top: -80, right: -80 }} />
        <div className="glow-orb" style={{ width: 220, height: 220, background: '#3FA796', bottom: -60, left: -60 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="brand"><span className="brand-dot" /> SafeHer</div>
          <div className="brand-sub">Safer routes. Faster help.</div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 26, lineHeight: 1.35, maxWidth: 380 }}>
            "Route B is slightly longer, but safer — fewer isolated stretches, more nearby help points."
          </p>
          <p style={{ color: '#9AA4BD', fontSize: 13, marginTop: 18 }}>
            A comparative safety-assist platform — not a guarantee, a second opinion before you walk.
          </p>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="eyebrow">Welcome back</div>
          <h1 className="auth-title">Sign in to SafeHer</h1>
          <p className="text-muted" style={{ marginBottom: 24 }}>Plan a safer route and keep trusted contacts in the loop.</p>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary btn-block" disabled={loading} type="submit">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="text-muted" style={{ marginTop: 18, textAlign: 'center' }}>
            New here? <Link to="/register" style={{ color: 'var(--color-accent-rose)', fontWeight: 600 }}>Create an account</Link>
          </p>
          <p className="text-muted" style={{ marginTop: 8, textAlign: 'center', fontSize: 12 }}>
            <Link to="/admin/login">Admin sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
