import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, UserPlus, Eye, EyeOff, ShieldCheck, HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', abhaId: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        abhaId: form.abhaId.trim() || undefined,
      });
      toast.success(
        data.devOtp
          ? `Email delivery simulated. Development OTP: ${data.devOtp}`
          : 'Account created! Check your email for verification OTP.'
      );
      navigate(`/verify-otp?email=${encodeURIComponent(form.email.trim())}`, {
        state: { devOtp: data.devOtp },
      });
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 mb-3 shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Patient Account</h1>
          <p className="mt-1.5 text-sm text-slate-500">Ayush Digital Pre-Consultation & Care Portal</p>
        </div>

        <div className="card shadow-lg border-slate-200/80 p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="label text-sm">Full Name *</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                className="input text-sm py-2.5"
                value={form.name}
                onChange={update('name')}
                placeholder="e.g. Ramesh Chandra"
              />
            </div>

            <div>
              <label htmlFor="email" className="label text-sm">Email Address *</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input text-sm py-2.5"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label text-sm">Password * (min 8 characters)</label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="input text-sm py-2.5 pr-10"
                  value={form.password}
                  onChange={update('password')}
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

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="abhaId" className="label text-sm">ABHA ID / Ayushman Bharat</label>
                <span className="text-[11px] text-slate-400">Optional</span>
              </div>
              <input
                id="abhaId"
                type="text"
                className="input text-sm py-2.5"
                value={form.abhaId}
                onChange={update('abhaId')}
                placeholder="XX-XXXX-XXXX-XXXX"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enables ABDM medical record linkage with government hospitals.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base shadow-sm mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HeartPulse className="w-4 h-4" />}
              {loading ? 'Registering…' : 'Create Account'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
