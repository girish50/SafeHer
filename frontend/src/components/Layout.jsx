import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/plan', label: 'Plan a Trip', icon: '◎' },
  { to: '/history', label: 'Trip History', icon: '☰' },
  { to: '/alerts', label: 'Alert History', icon: '⚠' },
  { to: '/contacts', label: 'Trusted Contacts', icon: '♡' },
  { to: '/support', label: 'Nearby Support', icon: '✚' },
  { to: '/profile', label: 'Profile', icon: '●' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.full_name
    ?.split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-dot" />
          SafeHer
        </div>
        <div className="brand-sub">Safer routes. Faster help.</div>

        <div className="nav-section-label">Navigate</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>{item.icon}</span> {item.label}
          </NavLink>
        ))}

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{initials || 'U'}</div>
            <div>
              <div className="user-name">{user?.full_name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button
            className="logout-btn"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
