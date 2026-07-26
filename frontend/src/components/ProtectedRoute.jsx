import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { advocate, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!advocate) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}
