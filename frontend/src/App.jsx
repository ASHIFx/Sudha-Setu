import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMe } from './store/authSlice.js';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import Navbar from './components/layout/Navbar.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import VerifyOtpPage from './pages/auth/VerifyOtpPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import IntakePage from './pages/patient/IntakePage.jsx';
import DashboardPage from './pages/doctor/DashboardPage.jsx';
import Spinner from './components/ui/Spinner.jsx';

function RoleRedirect() {
  const user = useSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (['doctor', 'support', 'admin'].includes(user.role)) return <Navigate to="/doctor/dashboard" replace />;
  return <Navigate to="/intake" replace />;
}

export default function App() {
  const dispatch = useDispatch();
  const loading = useSelector((s) => s.auth.loading);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route
            path="/intake"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <IntakePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'support', 'admin']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="/dashboard" element={<RoleRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
