import User, { USER_ROLES } from '../models/User.js';
import { signAccessToken } from '../config/jwt.js';

/**
 * Roles a client may pick during open registration. Elevated roles are granted
 * by an admin, never self-assigned -- otherwise anyone could register as a
 * doctor and start writing prescriptions.
 */
const SELF_ASSIGNABLE_ROLES = ['patient'];

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  role: user.role,
  languagePreference: user.languagePreference,
  abhaId: user.abhaId,
});

const respondWithToken = (res, status, user) => {
  const token = signAccessToken({ id: user._id, role: user.role });
  res.status(status).json({ token, user: toPublicUser(user) });
};

/**
 * POST /api/auth/register
 * Body: { name, phone, password, languagePreference?, abhaId? }
 *
 * Hashing is handled by the `pre('save')` hook on the User model, so the
 * plaintext password never needs to be touched here.
 */
export const register = async (req, res, next) => {
  try {
    const { name, phone, password, languagePreference, abhaId, role } = req.body ?? {};

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'name, phone and password are required' });
    }

    if (role && !SELF_ASSIGNABLE_ROLES.includes(role)) {
      return res.status(403).json({
        message: `Cannot self-register as '${role}'. Elevated roles are assigned by an admin.`,
      });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ message: 'An account with this phone number already exists' });
    }

    const user = await User.create({
      name,
      phone,
      password,
      languagePreference,
      // Empty string would trip the sparse unique index on a second signup.
      abhaId: abhaId || undefined,
      role: 'patient',
    });

    respondWithToken(res, 201, user);
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
      return res.status(409).json({ message: 'An account with these details already exists' });
    }
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Body: { phone, password }
 */
export const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body ?? {};

    if (!phone || !password) {
      return res.status(400).json({ message: 'phone and password are required' });
    }

    // `password` is `select: false` on the schema, so ask for it explicitly.
    const user = await User.findOne({ phone }).select('+password');

    // One message for both "no such user" and "wrong password" so the endpoint
    // can't be used to enumerate which phone numbers are registered.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    respondWithToken(res, 200, user);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns the caller's own profile. `protect` has already loaded the document.
 */
export const getMe = async (req, res) => {
  res.json({ user: toPublicUser(req.user) });
};

export { USER_ROLES };
