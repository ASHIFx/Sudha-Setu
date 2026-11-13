import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2, LogIn, Eye, EyeOff, Sparkles, Key } from 'lucide-react';
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
      toast.error(result.payload ?? 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 mb-3 shadow-sm">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sign in to Sudha Setu</h1>
          <p className="mt-1.5 text-sm text-slate-500">Ministry of Ayush • Ayurvedic Triage Portal</p>
        </div>

        <div className="card shadow-lg border-slate-200/80 p-8 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" /> Demo Quick-Fill
              </span>
              <span className="text-[11px] text-slate-400 font-normal">One-click credentials</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_PRESETS.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleSelectDemo(p)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg border border-slate-200 transition-colors text-left truncate flex items-center gap-1.5"
                >
                  <Key className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label text-sm">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input text-sm py-2.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="label text-sm">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input text-sm py-2.5 pr-10"
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

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base shadow-sm mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New to Sudha Setu?{' '}
              <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700">
                Register as a patient
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
