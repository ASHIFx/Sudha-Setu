import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const user = useSelector((s) => s.auth.user);

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (['doctor', 'support', 'admin'].includes(user.role)) {
      return <Navigate to="/doctor/dashboard" replace />;
    }
    return <Navigate to="/intake" replace />;
  }

  return children;
}
