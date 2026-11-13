import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut, User, Pill, Users, Stethoscope } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  Sudha Setu
                </span>
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 hidden sm:inline-block">
                  Health Triage
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block -mt-0.5">Voice Consultation & Smart Dispatch</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1 border-l border-slate-800 pl-4">
            <Link
              to="/medicines"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/medicines')
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Pill className="w-3.5 h-3.5 text-emerald-400" />
              <span>Medicines</span>
            </Link>

            <Link
              to="/providers"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/providers')
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-400" />
              <span>Doctors & Fleet</span>
            </Link>
          </div>
        </div>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/medicines"
            className={`md:hidden p-2 rounded-lg text-xs font-semibold transition-colors ${
              isActive('/medicines') ? 'text-emerald-400' : 'text-slate-400'
            }`}
            title="Medicines"
          >
            <Pill className="w-4 h-4" />
          </Link>
          <Link
            to="/providers"
            className={`md:hidden p-2 rounded-lg text-xs font-semibold transition-colors ${
              isActive('/providers') ? 'text-teal-400' : 'text-slate-400'
            }`}
            title="Doctors & Fleet"
          >
            <Users className="w-4 h-4" />
          </Link>

          {user ? (
            <>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive('/admin/dashboard')
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
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
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20'
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
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
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
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                  >
                    Start Triage
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
                <Link
                  to="/profile"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isActive('/profile')
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                  title="View Profile & Records"
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">{user.name?.split(' ')[0]}</span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {user.role}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
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
