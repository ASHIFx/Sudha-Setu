import mongoose from 'mongoose';

/**
 * Single shared Mongoose connection for the process.
 *
 * Mongoose buffers model calls until the connection is up, so this only needs
 * to be awaited once at boot. Repeated calls are a no-op.
 */
let connectionPromise = null;

export const connectDB = async () => {
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set. Copy .env.example to .env and fill it in.');
  }

  // Reject writes that don't match a schema path instead of silently dropping them.
  mongoose.set('strictQuery', true);

  connectionPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10_000,
      // Case sheets are small; keep the pool modest so a burst of triage
      // traffic doesn't exhaust Atlas connection limits.
      maxPoolSize: 20,
      minPoolSize: 2,
    })
    .then((m) => {
      console.log(`[db] connected: ${m.connection.host}/${m.connection.name}`);
      return m.connection;
    })
    .catch((err) => {
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
};

mongoose.connection.on('disconnected', () => {
  console.warn('[db] disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('[db] error:', err.message);
});

export const disconnectDB = async () => {
  connectionPromise = null;
  await mongoose.connection.close(false);
  console.log('[db] connection closed');
};

export default connectDB;
