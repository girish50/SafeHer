import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/admin/dashboard', label: 'Overview', icon: '◎' },
  { to: '/admin/risk-zones', label: 'Risk Zones', icon: '⚠' },
  { to: '/admin/support-points', label: 'Support Points', icon: '✚' },
  { to: '/admin/alerts', label: 'All Alerts', icon: '☰' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('safeher_admin') || 'null');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-dot" />
          SafeHer Admin
        </div>
        <div className="brand-sub">Risk data &amp; safety operations</div>

        <div className="nav-section-label">Manage</div>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>{item.icon}</span> {item.label}
          </NavLink>
        ))}

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{admin?.name?.[0] || 'A'}</div>
            <div>
              <div className="user-name">{admin?.name || 'Admin'}</div>
              <div className="user-email">{admin?.email}</div>
            </div>
          </div>
          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem('safeher_admin_token');
              localStorage.removeItem('safeher_admin');
              navigate('/admin/login');
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
