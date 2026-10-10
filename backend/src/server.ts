import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import { errorHandler } from './middleware/errorHandler';

// Route Imports
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import galleryRoutes from './routes/galleryRoutes';
import publicRoutes from './routes/publicRoutes';
import integrationRoutes from './routes/integrationRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import profileRoutes from './routes/profileRoutes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  message: { error: 'Too many login attempts, please try again later.' }
});

const galleryAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many gallery key attempts. Try again later.' },
});

// Middleware
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(cookieParser());
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((req, res, next) => {
  const isUnsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (process.env.NODE_ENV === 'production' && isUnsafeMethod && req.cookies?.token) {
    const origin = req.get('origin');
    if (!origin || !allowedOrigins.includes(origin)) {
      res.status(403).json({ error: 'Request origin is not allowed.' });
      return;
    }
  }
  next();
});
app.use(helmet());
app.use(morgan('dev'));

// Apply rate limits
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/public/access', galleryAccessLimiter);

// Basic health check
app.get('/health', (req: Request, res: Response) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/galleries', galleryRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Centralized Error Handling Middleware (MUST be last)
app.use(errorHandler);

export const startServer = async () => {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production.');
    if (!process.env.FRONTEND_URL) throw new Error('FRONTEND_URL is required in production.');
  }
  await connectDB();
  return app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

if (require.main === module) {
  startServer().catch(error => {
    console.error('Server startup failed:', error);
    process.exit(1);
  });
}
