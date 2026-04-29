import { HashRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import LoadingState from './components/common/LoadingState';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Students from './pages/Students';
import Rides from './pages/Rides';
import RoutesPage from './components/Routes';
import LiveMonitoring from './pages/LiveMonitoring';
import CampusBoundary from './pages/CampusBoundary';
import PopularPlaces from './pages/PopularPlaces';
import BusManagement from './pages/BusManagement';
import 'leaflet/dist/leaflet.css';

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingState title="Checking admin session" description="Restoring the secure dashboard workspace." fullScreen />;
  }

  return isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="students" element={<Students />} />
            <Route path="rides" element={<Rides />} />
            <Route path="routes" element={<RoutesPage />} />
            <Route path="live-monitoring" element={<LiveMonitoring />} />
            <Route path="campus-boundary" element={<CampusBoundary />} />
            <Route path="bus-management" element={<BusManagement />} />
            <Route path="popular-places" element={<PopularPlaces />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
