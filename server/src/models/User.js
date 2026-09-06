import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = ['patient', 'doctor', 'support', 'admin', 'ambulance'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      // 10-digit Indian mobile, optionally with +91 / 0 prefix.
      match: [/^(?:\+91|0)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      // Never ships in a query result unless explicitly selected.
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: '{VALUE} is not a supported role',
      },
      default: 'patient',
      index: true,
    },
    languagePreference: {
      type: String,
      default: 'auto',
      trim: true,
      lowercase: true,
    },
    abhaId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Mongoose 9 does not pass `next` to async middleware -- resolving the promise
// is what advances the chain. Taking a `next` param here would throw.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

/**
 * @param {string} candidate plaintext password from the login request
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  // Requires the document to have been loaded with `.select('+password')`.
  if (!this.password) {
    throw new Error('Password not loaded; query with .select("+password")');
  }
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
