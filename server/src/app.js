import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { initDb } from './repo/db.js';
import { initSSEService } from './services/sse.js';
import { startExpiryTimer } from './services/timer.js';
import { authenticate } from './middleware/auth.js';

import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import networkRoutes from './routes/network.js';
import resourceRoutes from './routes/resources.js';
import policyRoutes, { handleSimulate } from './routes/policy.js';
import adminRoutes from './routes/admin.js';
import accessRequestRoutes from './routes/accessRequests.js';
import configRoutes from './routes/config.js';
import eventRoutes from './routes/events.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB and background services
initDb();
initSSEService();
startExpiryTimer();

const app = express();

// Trust reverse proxy for Render / load balancers
app.set('trust proxy', 1);

// Security Headers (Helmet with CSP for self-hosted fonts & assets)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

// Compression middleware (skipping SSE stream)
app.use(compression({
  filter: (req, res) => {
    if (req.path === '/api/events' || req.originalUrl === '/api/events' || res.getHeader('Content-Type') === 'text/event-stream') {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/policy', policyRoutes);
app.post('/api/simulate', authenticate, handleSimulate);
app.use('/api/admin', adminRoutes);
app.use('/api/access-requests', accessRequestRoutes);
app.use('/api/config', configRoutes);
app.use('/api/events', eventRoutes);

// Unknown /api/* routes return JSON 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `API endpoint '${req.originalUrl}' not found`
    }
  });
});

// Single Origin Static Client & SPA Fallback
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Central Error Handler
app.use(errorHandler);

export default app;
