import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB, disconnectDB } from './config/db.js';
import { assertJwtConfig } from './config/jwt.js';
import authRoutes from './routes/authRoutes.js';
import caseRoutes from './routes/caseRoutes.js';

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // No Origin header => same-origin, curl, or a mobile client.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

const app = express();

app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Minimal request log. Swap for morgan once it's added to dependencies.
app.use((req, _res, next) => {
  if (NODE_ENV !== 'test') console.log(`[api] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sudha-setu-api', env: NODE_ENV, uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);

// Route modules mount here as they land:
//   app.use('/api/knowledge', knowledgeRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('[api]', err);
  res.status(status).json({
    message: status >= 500 && NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(NODE_ENV === 'production' ? {} : { stack: err.stack }),
  });
});

const server = http.createServer(app);

export const io = new SocketIOServer(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

// Lets controllers reach the socket server via `req.app.get('io')` without
// importing this module and creating a cycle.
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[socket] connected ${socket.id}`);

  // Dashboard clients subscribe here to get new cases pushed to them.
  // TODO: authenticate this handshake before it carries patient data.
  socket.on('doctors:join', () => socket.join('doctors'));

  // Rooms let the server push case updates to exactly one participant set:
  // the patient, the assigned doctor, and (for high-danger cases) dispatch.
  socket.on('case:join', (caseId) => {
    if (typeof caseId === 'string' && caseId) socket.join(`case:${caseId}`);
  });

  socket.on('case:leave', (caseId) => {
    if (typeof caseId === 'string' && caseId) socket.leave(`case:${caseId}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected ${socket.id} (${reason})`);
  });
});

const start = async () => {
  try {
    // Surface a bad JWT_SECRET at boot, not on the first login attempt.
    assertJwtConfig();
    await connectDB();
    server.listen(PORT, () => {
      console.log(`[api] Sudha Setu listening on :${PORT} (${NODE_ENV})`);
    });
  } catch (err) {
    console.error('[api] startup failed:', err.message);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`[api] ${signal} received, shutting down`);
  io.close();
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
  // Don't let an in-flight request hold the process open forever.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('[api] unhandled rejection:', reason);
});

start();

export { app, server };
