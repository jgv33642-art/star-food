import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

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
