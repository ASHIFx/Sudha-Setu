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
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Sudha Setu Portal
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Sign In to Your Console
          </h1>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Demo Role Quick-Fill:</span>
              <span>1-Click load</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_PRESETS.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleSelectDemo(p)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 hover:bg-teal-50 hover:text-teal-900 text-slate-700 rounded border border-slate-200/80 text-left transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label !mb-0">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-teal-700 font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{loading ? 'Authenticating…' : 'Sign In'}</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>New patient? </span>
            <Link to="/register" className="text-teal-700 font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
