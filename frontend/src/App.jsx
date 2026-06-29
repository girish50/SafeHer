import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PlanTrip from './pages/PlanTrip.jsx';
import RouteOptions from './pages/RouteOptions.jsx';
import ActiveTrip from './pages/ActiveTrip.jsx';
import TripHistory from './pages/TripHistory.jsx';
import AlertHistory from './pages/AlertHistory.jsx';
import TrustedContacts from './pages/TrustedContacts.jsx';
import Profile from './pages/Profile.jsx';
import EmergencySupport from './pages/EmergencySupport.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminRiskZones from './pages/admin/AdminRiskZones.jsx';
import AdminSupportPoints from './pages/admin/AdminSupportPoints.jsx';
import AdminAlerts from './pages/admin/AdminAlerts.jsx';
import AdminLayout from './components/AdminLayout.jsx';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminPrivateRoute({ children }) {
  const token = localStorage.getItem('safeher_admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/admin"
        element={
          <AdminPrivateRoute>
            <AdminLayout />
          </AdminPrivateRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="risk-zones" element={<AdminRiskZones />} />
        <Route path="support-points" element={<AdminSupportPoints />} />
        <Route path="alerts" element={<AdminAlerts />} />
      </Route>

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/plan" replace />} />
        <Route path="plan" element={<PlanTrip />} />
        <Route path="routes/:tripId" element={<RouteOptions />} />
        <Route path="trip/:tripId" element={<ActiveTrip />} />
        <Route path="history" element={<TripHistory />} />
        <Route path="alerts" element={<AlertHistory />} />
        <Route path="contacts" element={<TrustedContacts />} />
        <Route path="support" element={<EmergencySupport />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
