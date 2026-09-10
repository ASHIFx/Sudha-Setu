import { useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2, ShieldCheck, RefreshCw } from 'lucide-react';
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
      toast.success('Email verified! Welcome to Sudha Setu.');
      navigate('/intake');
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
        data.devOtp ? `Development OTP: ${data.devOtp}` : 'A new OTP has been sent if the email is valid.'
      );
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not resend the OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-4xl font-black text-slate-900">Verify Email</h1>
          <p className="mt-2 text-slate-500">
            Enter the 6-digit code sent to{' '}
            <span className="font-semibold text-slate-700">{email || 'your email'}</span>
          </p>
          {developmentOtp && (
            <p className="mt-2 text-sm font-semibold text-amber-700">
              Email delivery failed locally. Development OTP: {developmentOtp}
            </p>
          )}
        </div>

        <div className="card shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!prefillEmail && (
              <div>
                <label className="label text-base">Email Address</label>
                <input
                  type="email"
                  className="input text-base py-4"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            )}

            <div>
              <label className="label text-base text-center block mb-4">Verification Code</label>
              <div className="flex gap-3 justify-center" onPaste={handlePaste}>
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
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-colors bg-white"
                    aria-label={`OTP digit ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading || otp.join('').length < 6} className="btn-primary w-full py-4 text-lg">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {loading ? 'Verifying…' : 'Verify Code'}
            </button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Resend Code
            </button>
            <Link to="/login" className="text-sm text-slate-400 hover:text-slate-600">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
