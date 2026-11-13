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
import AmbulanceDashboardPage from './pages/ambulance/DashboardPage.jsx';
import AdminDashboardPage from './pages/admin/DashboardPage.jsx';
import ProfilePage from './pages/profile/ProfilePage.jsx';
import MedicinesPage from './pages/medicines/MedicinesPage.jsx';
import ProvidersPage from './pages/directory/ProvidersPage.jsx';
import HospitalsPage from './pages/directory/HospitalsPage.jsx';
import DoctorsPage from './pages/directory/DoctorsPage.jsx';
import DiseasesPage from './pages/directory/DiseasesPage.jsx';
import Spinner from './components/ui/Spinner.jsx';

function RoleRedirect() {
  const user = useSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'ambulance') return <Navigate to="/ambulance/dashboard" replace />;
  if (['doctor', 'support'].includes(user.role)) return <Navigate to="/doctor/dashboard" replace />;
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
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
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
          <Route path="/hospitals" element={<HospitalsPage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/diseases" element={<DiseasesPage />} />
          <Route path="/medicines" element={<MedicinesPage />} />
          <Route path="/providers" element={<ProvidersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

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

          <Route
            path="/ambulance/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ambulance', 'admin']}>
                <AmbulanceDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
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
