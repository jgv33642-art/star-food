import { Router } from 'express';
import { pool } from '../config/db';
import { env } from '../config/env';

const router = Router();

router.get('/health', async (req, res) => {
  const healthCheck = {
    uptime_seconds: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: env.NODE_ENV,
    services: {
      database: {
        status: 'unknown',
        latency: 0,
      }
    },
    memory: process.memoryUsage()
  };

  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - start;

    healthCheck.services.database.status = 'up';
    healthCheck.services.database.latency = latency;

    res.status(200).json(healthCheck);
  } catch (error: any) {
    healthCheck.message = 'Service Unavailable';
    healthCheck.services.database.status = 'down';
    
    console.error('[HEALTH CHECK FAILED] Database is down:', error.message);
    
    // Retorna 503 para que ferramentas como UptimeRobot considerem como QUEDA (downtime)
    res.status(503).json(healthCheck);
  }
});

export default router;
