import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { logoutUser } from '../../store/authSlice.js';

export default function Navbar() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">Sudha Setu</span>
              <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 hidden sm:inline-block">
                Health Triage
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block -mt-0.5">Voice-Enabled Consultation & Emergency Dispatch</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive('/admin/dashboard')
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Admin Hub
                  </Link>
                )}

                {user.role === 'ambulance' && (
                  <Link
                    to="/ambulance/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive('/ambulance/dashboard')
                        ? 'bg-rose-600 text-white'
                        : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                    }`}
                  >
                    Ambulance Console
                  </Link>
                )}

                {['doctor', 'support'].includes(user.role) && (
                  <Link
                    to="/doctor/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive('/doctor/dashboard')
                        ? 'bg-teal-700 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Doctor OPD
                  </Link>
                )}

                {user.role === 'patient' && (
                  <Link
                    to="/intake"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive('/intake')
                        ? 'bg-teal-600 text-white'
                        : 'text-teal-700 bg-teal-50 hover:bg-teal-100'
                    }`}
                  >
                    Start Triage
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <span className="text-xs font-medium text-slate-800 hidden sm:inline">
                  {user.name?.split(' ')[0]}
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {user.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary py-1.5 px-3.5 text-xs font-semibold"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
