import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
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
          ? `Development OTP: ${data.devOtp}`
          : 'Account created! Enter the verification code sent to your email.'
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Sudha Setu Portal
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Create Patient Account
          </h1>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                className="input"
                value={form.name}
                onChange={update('name')}
                placeholder="e.g. Ramesh Chandra"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                value={form.email}
                onChange={update('email')}
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password * (Minimum 8 characters)
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="input pr-10"
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="abhaId" className="label !mb-0">
                  Health ID / ABHA Number
                </label>
                <span className="text-[11px] text-slate-400">Optional</span>
              </div>
              <input
                id="abhaId"
                type="text"
                className="input"
                value={form.abhaId}
                onChange={update('abhaId')}
                placeholder="XX-XXXX-XXXX-XXXX"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Links clinical records across participating medical centers.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{loading ? 'Creating Account…' : 'Register Account'}</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>Already have an account? </span>
            <Link to="/login" className="text-teal-700 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
