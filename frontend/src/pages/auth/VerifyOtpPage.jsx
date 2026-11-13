import { useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
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
      toast.error(err.response?.data?.message ?? 'Invalid or expired code.');
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
        data.devOtp ? `Development OTP: ${data.devOtp}` : 'A new OTP has been sent if the email is registered.'
      );
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not resend the OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 mb-3 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Verify Your Email</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Enter the 6-digit code sent to <span className="font-semibold text-slate-700">{email || 'your email'}</span>
          </p>
          {developmentOtp && (
            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800">
              Dev Mode OTP: <span className="font-mono text-sm tracking-wider">{developmentOtp}</span>
            </div>
          )}
        </div>

        <div className="card shadow-lg border-slate-200/80 p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!prefillEmail && (
              <div>
                <label className="label text-sm">Registered Email</label>
                <input
                  type="email"
                  required
                  className="input text-sm py-2.5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            )}

            <div>
              <label className="label text-sm text-center block mb-3">6-Digit Verification Code</label>
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
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all shadow-sm"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="btn-primary w-full py-3 text-base shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? 'Verifying…' : 'Verify & Enter'}
            </button>
          </form>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Didn't get the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-brand-600 font-semibold hover:text-brand-700 flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
              Resend Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
