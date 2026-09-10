import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
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
      await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        abhaId: form.abhaId.trim() || undefined,
      });
      toast.success('Account created! Check your email for a verification code.');
      navigate(`/verify-otp?email=${encodeURIComponent(form.email.trim())}`);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-slate-900">Create account</h1>
          <p className="mt-2 text-slate-500">Register as a patient to start your consultation</p>
        </div>

        <div className="card shadow-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="label text-base">Full Name *</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                className="input text-base py-4"
                value={form.name}
                onChange={update('name')}
                placeholder="Ramesh Kumar"
              />
            </div>

            <div>
              <label htmlFor="email" className="label text-base">Email Address *</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input text-base py-4"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label text-base">Password * (min 8 characters)</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="input text-base py-4 pr-12"
                  value={form.password}
                  onChange={update('password')}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="abhaId" className="label text-base">
                ABHA ID <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="abhaId"
                type="text"
                className="input text-base py-4"
                value={form.abhaId}
                onChange={update('abhaId')}
                placeholder="XX-XXXX-XXXX-XXXX"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
