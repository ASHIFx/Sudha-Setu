import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut, User, Globe, Sparkles, ChevronDown, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import { logoutUser } from '../../store/authSlice.js';

export default function Navbar() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState('English');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#04150E]/90 backdrop-blur-md border-b border-[#124731]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-[1.5px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-[#04150E] rounded-full flex items-center justify-center">
                <Leaf className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-serif font-bold tracking-widest text-white group-hover:text-emerald-300 transition-colors uppercase">
                Sudha Setu
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 border-l border-[#124731] pl-6 text-xs font-semibold">
            <Link
              to="/hospitals"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isActive('/hospitals')
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'text-emerald-100/70 hover:text-white hover:bg-[#062016]'
              }`}
            >
              Hospitals
            </Link>

            <Link
              to="/doctors"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isActive('/doctors')
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'text-emerald-100/70 hover:text-white hover:bg-[#062016]'
              }`}
            >
              Doctors
            </Link>

            <Link
              to="/diseases"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isActive('/diseases')
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'text-emerald-100/70 hover:text-white hover:bg-[#062016]'
              }`}
            >
              Diseases
            </Link>

            <Link
              to="/medicines"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isActive('/medicines')
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'text-emerald-100/70 hover:text-white hover:bg-[#062016]'
              }`}
            >
              Medicines
            </Link>

            <Link
              to="/intake"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                isActive('/intake')
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Charak Vaani</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-100/80 bg-[#062016] border border-[#124731] hover:border-emerald-500/40 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang}</span>
              <ChevronDown className="w-3 h-3 text-emerald-400/70" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-[#062016] border border-[#124731] rounded-xl shadow-2xl py-1 z-50">
                {[
                  { label: 'English', code: 'en' },
                  { label: 'हिन्दी (Hindi)', code: 'hi' },
                  { label: 'বাংলা (Bengali)', code: 'bn' },
                  { label: 'मराठी (Marathi)', code: 'mr' },
                  { label: 'தமிழ் (Tamil)', code: 'ta' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => { setLang(item.label.split(' ')[0]); setShowLangMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-white hover:bg-[#0B2E20] transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              {user.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className="hidden sm:inline-block px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#062016] text-emerald-200 border border-[#124731] hover:bg-[#0B2E20]"
                >
                  Admin Hub
                </Link>
              )}

              {user.role === 'ambulance' && (
                <Link
                  to="/ambulance/dashboard"
                  className="hidden sm:inline-block px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white shadow-md shadow-rose-600/30"
                >
                  Ambulance
                </Link>
              )}

              {['doctor', 'support'].includes(user.role) && (
                <Link
                  to="/doctor/dashboard"
                  className="hidden sm:inline-block px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                >
                  Doctor OPD
                </Link>
              )}

              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#062016] border border-[#124731] hover:border-emerald-500/40 text-xs font-medium text-white transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                  {user.name?.[0] || 'U'}
                </div>
                <div className="text-left leading-tight hidden sm:block">
                  <span className="block font-bold text-white text-[11px] truncate max-w-[100px]">{user.name}</span>
                  <span className="block text-[10px] text-emerald-400 capitalize">{user.role}</span>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-emerald-100/60 hover:text-white hover:bg-[#062016] transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-100/80 hover:text-white hover:bg-[#062016] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}