import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';
import messageRoutes from './routes/messages.js';
import recruitmentRoutes from './routes/recruitment.js';
import { sanitizeRequest } from './middleware/sanitize.js';
import {
  rateLimit,
  securityHeaders,
  blockObviousScrapers,
} from './middleware/security.js';

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

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(securityHeaders);
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
  app.use(sanitizeRequest);

  // Global API rate limit (anti-scraping / brute force)
  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      max: 120,
      message: 'Too many requests. Please slow down and try again.',
    })
  );

  // Stricter limit on auth (credential stuffing / brute force)
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60_000,
      max: 40,
      message: 'Too many login attempts. Please try again later.',
    })
  );

  // Protect bulk applicant listing from simple scrapers
  app.use('/api/applications', blockObviousScrapers);
  app.use(
    '/api/applications',
    rateLimit({
      windowMs: 60_000,
      max: 60,
      message: 'Too many application requests. Please try again later.',
    })
  );

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/recruitment', recruitmentRoutes);

  return app;
}

const app = createApp();
export default app;
