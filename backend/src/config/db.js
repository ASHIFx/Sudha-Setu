import mongoose from 'mongoose';

let connectionPromise = null;
let reconnectTimer = null;

export const connectDB = async () => {
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set. Copy .env.example to .env and fill it in.');
  }

  mongoose.set('strictQuery', true);

  connectionPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 20,
      minPoolSize: 2,
    })
    .then((m) => {
      if (reconnectTimer) {
        clearInterval(reconnectTimer);
        reconnectTimer = null;
      }
      console.log(`[db] connected: ${m.connection.host}/${m.connection.name}`);
      return m.connection;
    })
    .catch((err) => {
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
};

export const startAutoReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setInterval(async () => {
    if (mongoose.connection.readyState === 0) {
      try {
        await connectDB();
      } catch (err) {
        console.warn(`[db] Reconnect attempt failed: ${err.message}. Retrying in 5s...`);
      }
    }
  }, 5000);
};

mongoose.connection.on('disconnected', () => {
  console.warn('[db] disconnected');
  startAutoReconnect();
});

mongoose.connection.on('error', (err) => {
  console.error('[db] error:', err.message);
});

export const disconnectDB = async () => {
  if (reconnectTimer) {
    clearInterval(reconnectTimer);
    reconnectTimer = null;
  }
  connectionPromise = null;
  await mongoose.connection.close(false);
  console.log('[db] connection closed');
};

export default connectDB;
