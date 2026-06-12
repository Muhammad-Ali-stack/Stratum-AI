import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import salesforceRouter from './routes/salesforce.js';
import chatRouter from './routes/chat.js';
import settingsRouter from './routes/settings.js';
import dashboardRouter from './routes/dashboard.js';
import recordsRouter from './routes/records.js';
import { startDailyDigestJob } from './jobs/dailyDigest.js';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
  }),
);

const allowedOrigins = [
  config.CORS_ORIGIN,
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];

if (process.env['REPLIT_DEV_DOMAIN']) {
  allowedOrigins.push(`https://${process.env['REPLIT_DEV_DOMAIN']}`);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} ${res.statusCode}`,
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use(globalRateLimiter);

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/salesforce', salesforceRouter);
app.use('/api/chat', chatRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/salesforce/records', recordsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const host = '0.0.0.0';
const server = app.listen(config.PORT, host, () => {
  logger.info({ port: config.PORT, host, env: config.NODE_ENV }, 'Stratum AI backend started');
  startDailyDigestJob();
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'Received shutdown signal, closing server gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

export default app;
