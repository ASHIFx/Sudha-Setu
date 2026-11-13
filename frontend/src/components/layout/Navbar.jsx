import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut, Stethoscope, User, Shield, Truck, HeartPulse, Sparkles } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-slate-900 tracking-tight">
                Sudha Setu
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">
                Ayush Grid
              </span>
            </div>
            <span className="hidden md:block text-[11px] font-medium text-slate-400 -mt-0.5">
              Ministry of Ayush • Voice Triage Platform
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive('/admin/dashboard')
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Admin Hub</span>
                  </Link>
                )}

                {user.role === 'ambulance' && (
                  <Link
                    to="/ambulance/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive('/ambulance/dashboard')
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Ambulance Dispatch</span>
                  </Link>
                )}

                {['doctor', 'support'].includes(user.role) && (
                  <Link
                    to="/doctor/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive('/doctor/dashboard')
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Doctor Console</span>
                  </Link>
                )}

                {user.role === 'patient' && (
                  <Link
                    to="/intake"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive('/intake')
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-teal-700 bg-teal-50 hover:bg-teal-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Start Intake</span>
                  </Link>
                )}
              </div>

              <div className="h-5 w-px bg-slate-200 hidden sm:block" />

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/60">
                <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                    {user.role}
                  </span>
                </div>
                <span className="lg:hidden text-xs font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 capitalize border border-slate-200">
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary px-4 py-2 text-xs"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
