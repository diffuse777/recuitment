import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';
import messageRoutes from './routes/messages.js';

dotenv.config();

// Local DNS often refuses MongoDB Atlas SRV lookups; use public resolvers for this process.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const allowedOrigins = [
  'http://localhost:5173',
  'https://owaspxcybernerds.xyz',
  'https://www.owaspxcybernerds.xyz',
  process.env.FRONTEND_URL,
].filter(Boolean);

let cachedConnection = null;

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set');
    return null;
  }

  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  cachedConnection = await mongoose.connect(uri, {
    family: 4,
    serverSelectionTimeoutMS: 20000,
  });
  console.log('Connected to MongoDB');
  return cachedConnection;
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, origin || true);
          return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/messages', messageRoutes);

  return app;
}

const app = createApp();
export default app;
