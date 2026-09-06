import jwt from 'jsonwebtoken';

/**
 * Shared JWT helpers. Both the auth controller (signing) and the auth
 * middleware (verifying) go through here so the secret is read and validated
 * in exactly one place.
 */

const DEFAULT_EXPIRES_IN = '7d';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  // Fail loudly. A missing secret must never silently fall back to a
  // hardcoded default -- that would make every token forgeable.
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is missing or shorter than 32 characters. Set a long random value in .env'
    );
  }
  return secret;
};

/** Throws at boot if the secret is unusable, rather than on the first login. */
export const assertJwtConfig = () => {
  getSecret();
};

/**
 * @param {{ id: string, role: string }} payload
 * @returns {string} signed access token
 */
export const signAccessToken = ({ id, role }) =>
  jwt.sign({ sub: String(id), role }, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN,
    issuer: 'sudha-setu',
  });

/**
 * @param {string} token
 * @returns {{ sub: string, role: string, iat: number, exp: number }}
 * @throws {jwt.JsonWebTokenError} on invalid signature, malformed token, or expiry
 */
export const verifyAccessToken = (token) =>
  jwt.verify(token, getSecret(), { issuer: 'sudha-setu' });
