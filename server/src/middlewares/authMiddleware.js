import { verifyAccessToken } from '../config/jwt.js';
import User from '../models/User.js';

/**
 * Verifies the access token and attaches the live user document to `req.user`.
 *
 * Token lookup order:
 *   1. `accessToken` HTTP-Only cookie (preferred — set by the auth controller)
 *   2. `Authorization: Bearer <token>` header (mobile / API clients)
 *
 * The user is re-read from the database on every request rather than trusted
 * from the token body, so a role change or account deletion takes effect
 * immediately instead of waiting for the token to expire.
 */
export const protect = async (req, res, next) => {
  // 1. Try cookie first
  let token = req.cookies?.accessToken;

  // 2. Fall back to Authorization header
  if (!token) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      token = header.slice(7).trim();
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorised: no token provided' });
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    // Distinguish expiry so the client knows to refresh rather than re-login.
    const expired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      message: expired ? 'Session expired, please log in again' : 'Not authorised: invalid token',
      code: expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    });
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    return res.status(401).json({ message: 'Not authorised: account no longer exists' });
  }

  req.user = user;
  next();
};

/**
 * Restricts a route to the given roles. Must be mounted after `protect`.
 *
 * @param {...('patient'|'doctor'|'support'|'admin'|'ambulance')} allowedRoles
 * @example router.get('/queue', protect, authorize('doctor', 'admin'), getQueue)
 */
export const authorize = (...allowedRoles) => {
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      // A programming error, not a client error: authorize was mounted
      // without protect in front of it.
      return next(new Error('authorize() requires protect() to run first'));
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: this action requires one of [${roles.join(', ')}]`,
      });
    }

    next();
  };
};
