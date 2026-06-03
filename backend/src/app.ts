import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { runAutoMigration } from './utils/autoMigration';
import { logger } from './utils/logger';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Logger de Requisições
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Rate Limiter para segurança e proteção contra DDoS/sobrecarga
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Limite de 1000 requisições por IP a cada 15 min
  message: {
    message: 'Muitas requisições criadas a partir deste IP. Por favor, tente novamente após 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Auto-migration: runs in background on first request, never blocks API responses
app.use((req, res, next) => {
  runAutoMigration().catch((err) =>
    logger.error(`[MIGRATION_BACKGROUND_ERROR] ${err.message || err}`)
  );
  next();
});

// API Routes
app.use('/api', routes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', environment: env.NODE_ENV });
});

// Global Error Handler
app.use(errorMiddleware);

export default app;
