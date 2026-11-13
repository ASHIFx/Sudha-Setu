import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from '../ui/Spinner.jsx';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, initialized, loading } = useSelector((s) => s.auth);

  if (!initialized && loading && !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (['doctor', 'support', 'admin'].includes(user.role)) {
      return <Navigate to="/doctor/dashboard" replace />;
    }
    return <Navigate to="/intake" replace />;
  }

  return children;
}
