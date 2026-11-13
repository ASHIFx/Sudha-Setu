import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import {
  register,
  login,
  logout,
  refresh,
  getMe,
  updateProfile,
  verifyOtp,
  resendVerificationOtp,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateAuthInput } from '../middlewares/authInput.js';

const router = Router();
router.use(validateAuthInput);

const IS_PROD = process.env.NODE_ENV === 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PROD ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !IS_PROD,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PROD ? 5 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !IS_PROD,
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/resend-otp', otpLimiter, resendVerificationOtp);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', otpLimiter, resetPassword);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);

export default router;
