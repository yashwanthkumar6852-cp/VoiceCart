import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import os from 'os';
import { config } from './config';
import searchRoutes from './routes/searchRoutes';
import voiceRoutes from './routes/voiceRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import authRoutes from './routes/authRoutes';
import accountRoutes from './routes/accountRoutes';
import productRoutes from './routes/productRoutes';
import compareRoutes from './routes/compareRoutes';
import feedRoutes from './routes/feedRoutes';
import imageRoutes from './routes/imageRoutes';
import catalogRoutes from './routes/catalogRoutes';
import { VALID_FEED_CATEGORIES } from './constants/routes';
import { dashboardFeedService } from './services/dashboardFeedService';
import { otpService } from './services/otpService';
import { dbClient } from './db/dbClient';
import { cacheService } from './cache/redisClient';

const app = express();

// Trust proxy for secure cookie headers and accurate rate limiting behind Render / Vercel
app.set('trust proxy', 1);

// Security headers with relaxed policies for cross-origin voice audio & images
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Gzip/Brotli payload compression for fast API responses
app.use(compression());

// General rate limiter: 2000 req/min in development, 240 req/min in production per IP
const isDev = process.env.NODE_ENV !== 'production';
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 2000 : 240,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/api/health' || req.path.endsWith('/status'),
  message: { error: 'Too many requests, please slow down.' }
});

// Dedicated search & feed quota guard: 1000 req/min in dev, 120 req/min in production
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 1000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.endsWith('/status') || req.path.includes('/status'), // Never rate-limit store/search status pings
  message: { error: 'Search rate limit reached. Please wait a moment before searching again.', isRateLimited: true }
});

// Parse configured CORS origins (supports comma-separated list)
const configuredOrigins = (config.corsOrigin || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  ...configuredOrigins,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      // Check explicit allowed list
      if (defaultAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow all Vercel, Render, and Localtunnel subdomains
      if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com') || origin.endsWith('.loca.lt')) {
        return callback(null, true);
      }

      // In development or local testing, allow any private LAN network origin (e.g. 192.168.x.x:5173 or 10.x.x.x)
      if (process.env.NODE_ENV !== 'production') {
        if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
      }

      return callback(null, origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-session-id', 'x-csrf-token']
  })
);

app.use(cookieParser());
app.use(
  express.json({
    limit: '5mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    }
  })
);
app.use(express.urlencoded({ extended: true }));
app.use('/api/', apiLimiter);
app.use(['/api/search', '/api/feed', '/api/products/feed', '/api/voice/process'], searchLimiter);

// Health check endpoint (status, version, enabled providers by name only, database & cache connectivity)
app.get(['/health', '/api/health'], async (_req: Request, res: Response) => {
  const dbPing = await dbClient.ping();
  const cachePing = await cacheService.ping();

  const enabledProviders: string[] = [];
  if (config.amazon.isEnabled) enabledProviders.push('amazon');
  if (config.flipkart.isEnabled) enabledProviders.push('flipkart');
  if (config.meesho.isEnabled) enabledProviders.push('meesho');
  if (config.serpApiKey) enabledProviders.push('serpapi');
  if (config.geminiApiKey) enabledProviders.push('gemini');
  if (config.sarvamApiKey) enabledProviders.push('sarvam');
  if (config.groqApiKey) enabledProviders.push('groq');

  const isHealthy = dbPing.ok;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    version: '1.0.0',
    service: 'VoiceCart Backend API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbPing.ok,
      type: dbPing.type,
      latencyMs: dbPing.latencyMs
    },
    cache: {
      connected: cachePing.ok,
      type: cachePing.type
    },
    feedCategories: VALID_FEED_CATEGORIES,
    feedCacheState: dashboardFeedService.getCacheState(),
    enabledProviders,
    otpChannels: otpService.getAvailableChannels(),
    paymentGateway: 'VoiceCart Pay Gateway (Simulated)'
  });
});

// API Routes
app.use('/api/feed', feedRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/products', productRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/catalog', catalogRoutes);

// 404 handler for unmatched API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    path: req.originalUrl,
    status: 404
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err?.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

/**
 * Helper to get primary Local Area Network IPv4 address
 */
function getLanIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

/**
 * Print all registered Express routes on startup
 */
function printRegisteredRoutes(appInstance: express.Express) {
  const routes: { method: string; path: string }[] = [];

  function extractRoutes(layer: any, prefix = '') {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase()).join(', ');
      routes.push({ method: methods, path: `${prefix}${layer.route.path}` });
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      let routerPrefix = prefix;
      if (layer.regexp) {
        const match = layer.regexp.source
          .replace('^\\', '')
          .replace('\\/?(?=\\/|$)', '')
          .replace('(?=\\/|$)', '')
          .replace(/\\\//g, '/');
        if (match && !match.startsWith('^')) {
          routerPrefix += match;
        }
      }
      layer.handle.stack.forEach((subLayer: any) => extractRoutes(subLayer, routerPrefix));
    }
  }

  if (appInstance._router && appInstance._router.stack) {
    appInstance._router.stack.forEach((layer: any) => extractRoutes(layer));
  }

  console.log(`\n📋 [ROUTE LIST] ${routes.length} Registered API Routes:`);
  routes.forEach((r) => {
    console.log(`   ${r.method.padEnd(8)} ${r.path}`);
  });
  console.log('');
}

const PORT = config.port;
const server = app.listen(PORT, '0.0.0.0', () => {
  const lanIp = getLanIpAddress();
  console.log(`
  🎙️  ======================================================
     VOICECART BACKEND API STARTED ON PORT ${PORT} (0.0.0.0)
     Local Access   : http://localhost:${PORT}
     Network Access : http://${lanIp}:${PORT}
     Health Check   : http://localhost:${PORT}/api/health
     Feed Endpoint  : http://localhost:${PORT}/api/feed
     Environment    : ${config.nodeEnv}
     Note on Voice  : Voice microphone input requires HTTPS (e.g. Vercel link).
                      Browsers block microphone access over plain HTTP LAN.
  ======================================================
  `);

  if (process.env.NODE_ENV !== 'production') {
    printRegisteredRoutes(app);
  }
});

export default app;
