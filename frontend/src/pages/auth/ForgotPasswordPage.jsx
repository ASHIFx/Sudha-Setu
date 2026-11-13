import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success('Reset code sent if the email exists.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code.trim() || !newPassword) return;
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Invalid or expired reset code.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-[#0B0F19]">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Password Reset Complete</h2>
          <p className="text-xs text-slate-400">Your account credentials have been updated.</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary w-full py-2.5 text-xs font-bold"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-[#0B0F19]">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Credential Recovery</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1 ? 'Enter your registered email address.' : 'Enter the security code and new password.'}
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">
                  Registered Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-xs font-bold"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{loading ? 'Sending Code…' : 'Send Reset Code'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="label">Verification Code</label>
                <input
                  type="text"
                  required
                  className="input font-mono"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                />
              </div>
              <div>
                <label className="label">New Password (min 8 chars)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    className="input pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                <span>{loading ? 'Updating Password…' : 'Set New Password'}</span>
              </button>
            </form>
          )}

          <div className="pt-3 mt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <Link to="/login" className="text-emerald-400 font-semibold hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
