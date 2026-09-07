import jwt from 'jsonwebtoken';

/**
 * JWT utility — dual-token generation and HTTP-Only cookie helpers.
 *
 * The signing secret is read from config/jwt.js (single source of truth).
 * This module adds the PRD-spec token pair and cookie management that the
 * config module intentionally doesn't cover.
 */

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is missing or shorter than 32 characters. Set a long random value in .env'
    );
  }
  return secret;
};

/**
 * Short-lived access token carrying the user id and role.
 * @param {string} userId
 * @param {string} role
 * @returns {string}
 */
export const generateAccessToken = (userId, role) =>
  jwt.sign({ sub: String(userId), role }, getSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    issuer: 'sudha-setu',
  });

/**
 * Long-lived refresh token carrying only the user id.
 * @param {string} userId
 * @returns {string}
 */
export const generateRefreshToken = (userId) =>
  jwt.sign({ sub: String(userId) }, getSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'sudha-setu',
  });

/**
 * Verify any token (access or refresh) signed with our secret.
 * @param {string} token
 * @returns {object} decoded payload
 */
export const verifyToken = (token) =>
  jwt.verify(token, getSecret(), { issuer: 'sudha-setu' });

/* ---------- cookie helpers ---------- */

/** Parse "7d", "15m", etc. to milliseconds for cookie maxAge. */
const toMs = (expr) => {
  const match = expr.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback 7 days
  const n = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * multipliers[unit];
};

const cookieDefaults = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
  };
};

/**
 * Set both accessToken and refreshToken as HTTP-Only cookies on the response.
 * @param {import('express').Response} res
 * @param {string} accessToken
 * @param {string} refreshToken
 */
export const setTokenCookies = (res, accessToken, refreshToken) => {
  const defaults = cookieDefaults();

  res.cookie('accessToken', accessToken, {
    ...defaults,
    maxAge: toMs(ACCESS_TOKEN_EXPIRES_IN),
  });

  res.cookie('refreshToken', refreshToken, {
    ...defaults,
    maxAge: toMs(REFRESH_TOKEN_EXPIRES_IN),
  });
};

/**
 * Clear both token cookies.
 * @param {import('express').Response} res
 */
export const clearTokenCookies = (res) => {
  const defaults = cookieDefaults();

  res.clearCookie('accessToken', defaults);
  res.clearCookie('refreshToken', defaults);
};
