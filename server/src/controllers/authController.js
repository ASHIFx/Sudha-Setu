import crypto from 'node:crypto';
import User, { USER_ROLES } from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setTokenCookies,
  clearTokenCookies,
} from '../utils/jwt.js';

/**
 * Roles a client may pick during open registration. Elevated roles are granted
 * by an admin, never self-assigned -- otherwise anyone could register as a
 * doctor and start writing prescriptions.
 */
const SELF_ASSIGNABLE_ROLES = ['patient'];

/** Build the public user payload returned to the client. */
const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  abhaId: user.abhaId ?? null,
});

/**
 * Hash the refresh token before storing it in the DB. This way, if the
 * database is compromised, the raw tokens cannot be replayed.
 */
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Generate both tokens, store the hashed refresh token in the DB, set cookies,
 * and respond with the user payload.
 */
const issueTokensAndRespond = async (res, user, statusCode = 200) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Persist the hashed refresh token so we can validate it on /refresh and
  // revoke it on /logout.
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  res.status(statusCode).json({ user: toPublicUser(user) });
};

/* ------------------------------------------------------------------ */
/*  POST /api/auth/register                                           */
/* ------------------------------------------------------------------ */
/**
 * Body: { name, email, password, abhaId?, role? }
 *
 * Hashing is handled by the `pre('save')` hook on the User model, so the
 * plaintext password never needs to be touched here.
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, abhaId, role } = req.body ?? {};

    // ---- validation ----
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    if (role && !SELF_ASSIGNABLE_ROLES.includes(role)) {
      return res.status(403).json({
        message: `Cannot self-register as '${role}'. Elevated roles are assigned by an admin.`,
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      // Empty string would trip the sparse unique index on a second signup.
      abhaId: abhaId || undefined,
      role: 'patient',
    });

    await issueTokensAndRespond(res, user, 201);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: Object.fromEntries(
          Object.entries(err.errors).map(([field, e]) => [field, e.message])
        ),
      });
    }
    // Unique index raced past the findOne check above.
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An account with these details already exists' });
    }
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/*  POST /api/auth/login                                              */
/* ------------------------------------------------------------------ */
/**
 * Body: { email, password }
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    // `password` is `select: false` on the schema, so ask for it explicitly.
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    // One message for both "no such user" and "wrong password" so the endpoint
    // can't be used to enumerate which emails are registered.
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await issueTokensAndRespond(res, user, 200);
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/*  POST /api/auth/logout                                             */
/* ------------------------------------------------------------------ */
export const logout = async (req, res, next) => {
  try {
    // Read the refresh token so we can revoke it from the DB.
    const token = req.cookies?.refreshToken;

    if (token) {
      const hashed = hashToken(token);
      // Unset the stored refresh token so it can never be replayed.
      await User.findOneAndUpdate({ refreshToken: hashed }, { refreshToken: null });
    }

    clearTokenCookies(res);

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/*  POST /api/auth/refresh                                            */
/* ------------------------------------------------------------------ */
export const refresh = async (req, res, next) => {
  try {
    // Read refresh token from cookie first, then Authorization header fallback.
    const token =
      req.cookies?.refreshToken ||
      (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7));

    if (!token) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Verify the token is still stored in the DB (not revoked).
    const hashed = hashToken(token);
    const user = await User.findOne({ _id: payload.sub }).select('+refreshToken');

    if (!user || user.refreshToken !== hashed) {
      return res.status(401).json({ message: 'Refresh token revoked or invalid' });
    }

    // Issue only a new access token (keep existing refresh token alive).
    const newAccessToken = generateAccessToken(user._id, user.role);

    // Update only the access token cookie.
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(200).json({ message: 'Access token refreshed' });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/*  GET /api/auth/me                                                  */
/* ------------------------------------------------------------------ */
/**
 * Returns the caller's own profile. `protect` has already loaded the document.
 */
export const getMe = async (req, res) => {
  res.json({ user: toPublicUser(req.user) });
};

export { USER_ROLES };
