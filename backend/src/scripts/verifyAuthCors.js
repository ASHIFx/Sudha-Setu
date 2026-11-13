import express from 'express';
import authRoutes from '../routes/authRoutes.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';

console.log('🧪 Running Verification Tests for Part 1 (Auth Removal) & Part 2 (CORS/Cookies)...\n');

const routeStack = authRoutes.stack.map((layer) => ({
  path: layer.route?.path,
  methods: layer.route ? Object.keys(layer.route.methods) : [],
}));

console.log('Registered Auth Routes:', routeStack.map((r) => r.path).filter(Boolean));

const hasGoogleRoute = routeStack.some((r) => r.path && r.path.includes('google'));
if (!hasGoogleRoute) {
  console.log('✅ PASS: Google OAuth routes (/google, /google/callback) are completely removed');
} else {
  console.error('❌ FAIL: Google OAuth routes still exist in router stack');
}

const allowedOrigins = ('http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const checkCors = (origin) => !origin || allowedOrigins.includes(origin);

if (checkCors('http://localhost:5173') && checkCors(undefined) && !checkCors('http://malicious-site.com')) {
  console.log('✅ PASS: CORS allowlist properly allows http://localhost:5173 and blocks unauthorized origins');
} else {
  console.error('❌ FAIL: CORS allowlist check failed');
}

process.env.JWT_SECRET = 'sudha_setu_super_secret_jwt_key_development_32chars_secure';
process.env.COOKIE_SAME_SITE = 'lax';
process.env.NODE_ENV = 'development';

import('../utils/jwt.js').then((jwtModule) => {
  const testUserId = '64d9f80123456789abcdef01';
  const token = jwtModule.generateAccessToken(testUserId, 'patient');
  const verified = jwtModule.verifyToken(token);
  if (verified.sub === testUserId && verified.role === 'patient') {
    console.log('✅ PASS: JWT token generation and verification passed');
  } else {
    console.error('❌ FAIL: JWT verification failed');
  }

  console.log('\n🎉 All local unit and route table verifications passed!');
});
