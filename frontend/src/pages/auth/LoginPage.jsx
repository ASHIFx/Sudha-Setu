import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser } from '../../store/authSlice.js';

const DEMO_PRESETS = [
  { role: 'Doctor', email: 'dr.sharma@demo.sudhasetu.in', pass: 'DemoPass@123', label: 'Doctor (OPD)' },
  { role: 'Ambulance', email: 'driver.manoj@demo.sudhasetu.in', pass: 'DemoPass@123', label: 'Ambulance' },
  { role: 'Admin', email: 'admin@demo.sudhasetu.in', pass: 'DemoPass@123', label: 'Admin' },
  { role: 'Patient', email: 'patient.amit@demo.sudhasetu.in', pass: 'DemoPass@123', label: 'Patient' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSelectDemo = (preset) => {
    setEmail(preset.email);
    setPassword(preset.pass);
    toast.success(`Loaded credentials for ${preset.label}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    const result = await dispatch(loginUser({ email: email.trim(), password }));
    setLoading(false);
    if (loginUser.fulfilled.match(result)) {
      const user = result.payload;
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'ambulance') {
        navigate('/ambulance/dashboard');
      } else if (['doctor', 'support'].includes(user.role)) {
        navigate('/doctor/dashboard');
      } else {
        navigate('/intake');
      }
    } else {
      toast.error(result.payload ?? 'Login failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
            Ministry of Ayush • Triage Portal
          </p>
          <h1 className="text-2xl font-bold text-slate-900 text-center mt-1">
            Sign In to Clinical Console
          </h1>
        </div>

        <div className="bg-white border border-slate-200 rounded p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Demo Role Quick-Fill:</span>
              <span>Click to auto-populate</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_PRESETS.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleSelectDemo(p)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-800 rounded border border-slate-200 text-left transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="w-full text-xs px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-teal-800 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="w-full text-xs px-3 py-2 rounded border border-slate-300 pr-9 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-bold transition-colors disabled:opacity-60"
            >
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>Patient without an account? </span>
            <Link to="/register" className="text-teal-800 font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
