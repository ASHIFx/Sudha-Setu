import { useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2 } from 'lucide-react';
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
            Account Verification
          </p>
          <h1 className="text-2xl font-bold text-slate-900 text-center mt-1">
            Enter Verification Code
          </h1>
          <p className="text-xs text-slate-500 text-center mt-1">
            Sent to <span className="font-semibold text-slate-800">{email || 'your email'}</span>
          </p>
          {developmentOtp && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-center text-xs text-amber-800">
              Dev Mode OTP: <span className="font-mono font-bold">{developmentOtp}</span>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded p-6 shadow-xs space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!prefillEmail && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full text-xs px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 text-center mb-2">
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
                    className="w-10 h-12 text-center text-lg font-mono font-bold rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-bold transition-colors disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
          </form>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Did not receive code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-teal-800 font-semibold hover:underline disabled:opacity-50"
            >
              Resend Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
