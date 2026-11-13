import { useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import { setUser } from '../../store/authSlice.js';

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get('email') ?? '';
  const location = useLocation();
  const developmentOtp = location.state?.devOtp;

  const [email, setEmail] = useState(prefillEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleOtpChange = (i, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[i] = value.slice(-1);
    setOtp(next);
    if (value && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6 || !email.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email: email.trim(), code });
      dispatch(setUser(data.user));
      toast.success('Email verified successfully!');
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'ambulance') {
        navigate('/ambulance/dashboard');
      } else if (['doctor', 'support'].includes(data.user.role)) {
        navigate('/doctor/dashboard');
      } else {
        navigate('/intake');
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setResending(true);
    try {
      const { data } = await api.post('/auth/resend-otp', { email: email.trim() });
      toast.success(
        data.devOtp ? `Development OTP: ${data.devOtp}` : 'A new code has been sent if the email is registered.'
      );
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-[#0B0F19]">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Account Verification</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Enter Verification Code
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sent to <span className="font-semibold text-slate-200">{email || 'your email'}</span>
          </p>
          {developmentOtp && (
            <div className="mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-300">
              Dev Mode OTP: <span className="font-mono font-bold tracking-wider">{developmentOtp}</span>
            </div>
          )}
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!prefillEmail && (
              <div>
                <label className="label">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
            )}

            <div>
              <label className="label text-center">
                6-Digit Security Code
              </label>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-13 text-center text-xl font-mono font-bold rounded-lg border border-slate-700 bg-slate-950/80 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{loading ? 'Verifying…' : 'Verify & Continue'}</span>
            </button>
          </form>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
            <span>Did not receive code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-emerald-400 font-semibold hover:underline disabled:opacity-50"
            >
              Resend Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
