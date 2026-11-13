import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut, Stethoscope, Shield, Truck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { logoutUser } from '../../store/authSlice.js';

export default function Navbar() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Sudha Setu
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Ministry of Ayush
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              National Ayurvedic Triage & Pre-Consultation Portal
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-1 sm:gap-2">
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                      isActive('/admin/dashboard')
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Admin Hub
                  </Link>
                )}

                {user.role === 'ambulance' && (
                  <Link
                    to="/ambulance/dashboard"
                    className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                      isActive('/ambulance/dashboard')
                        ? 'bg-red-700 text-white border-red-700'
                        : 'border-red-200 text-red-700 hover:bg-red-50'
                    }`}
                  >
                    Ambulance Console
                  </Link>
                )}

                {['doctor', 'support'].includes(user.role) && (
                  <Link
                    to="/doctor/dashboard"
                    className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                      isActive('/doctor/dashboard')
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    OPD Queue
                  </Link>
                )}

                {user.role === 'patient' && (
                  <Link
                    to="/intake"
                    className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                      isActive('/intake')
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'border-teal-200 text-teal-800 bg-teal-50 hover:bg-teal-100'
                    }`}
                  >
                    Patient Intake
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
                <span className="text-xs text-slate-700 hidden sm:inline font-medium">
                  {user.name?.split(' ')[0]}
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {user.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white transition-colors"
              >
                Patient Registration
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
