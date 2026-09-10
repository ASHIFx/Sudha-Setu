import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut, Stethoscope, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { logoutUser } from '../../store/authSlice.js';

export default function Navbar() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-brand-700 tracking-tight">Sudha Setu</span>
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{user.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 capitalize">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost px-3 py-2 text-sm flex items-center gap-1.5"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost px-4 py-2 text-sm">
                Login
              </Link>
              <Link to="/register" className="btn-primary px-4 py-2 text-sm">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
