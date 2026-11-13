import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-[#0B0F19]">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Access</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Sign In to Your Console
          </h1>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="border-b border-slate-800 pb-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Demo Role Quick-Fill:</span>
              <span className="text-emerald-400 font-mono text-[11px]">1-Click load</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_PRESETS.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleSelectDemo(p)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-slate-800/80 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30 text-slate-300 rounded-lg border border-slate-700/60 text-left transition-colors"
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
                <Link to="/forgot-password" className="text-xs text-emerald-400 font-medium hover:underline">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
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

          <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>New patient? </span>
            <Link to="/register" className="text-emerald-400 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
