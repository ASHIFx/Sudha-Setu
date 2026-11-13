import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded p-6 shadow-sm text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Password Reset Complete</h2>
          <p className="text-xs text-slate-500">Your account credentials have been updated.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-bold transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
            Credential Recovery
          </p>
          <h1 className="text-2xl font-bold text-slate-900 text-center mt-1">
            Reset Password
          </h1>
          <p className="text-xs text-slate-500 text-center mt-1">
            {step === 1 ? 'Enter your registered email address.' : 'Enter the security code and new password.'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm">
          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full text-xs px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-bold transition-colors disabled:opacity-60"
              >
                {loading ? 'Sending Code…' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Code</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs px-3 py-2 font-mono rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (min 8 chars)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 pr-9 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                {loading ? 'Updating Password…' : 'Set New Password'}
              </button>
            </form>
          )}

          <div className="pt-3 mt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            <Link to="/login" className="text-teal-800 font-semibold hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
