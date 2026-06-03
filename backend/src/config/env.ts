import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().optional(),
  POSTGRES_URL: z.string().optional(),
  POSTGRES_URL_NON_POOLING: z.string().optional(),
  JWT_SECRET: z.string().optional().default('star-food-secret-jwt-token-fallback'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADO_PAGO_PUBLIC_KEY: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables');
}

// Extract valid database URL from available envs
const rawDbUrl = _env.data.DATABASE_URL || _env.data.POSTGRES_URL || _env.data.POSTGRES_URL_NON_POOLING;

if (!rawDbUrl) {
  console.error('❌ Database connection string not found. Please provide DATABASE_URL or POSTGRES_URL.');
  throw new Error('Missing database connection string');
}

export const env = {
  ..._env.data,
  DATABASE_URL: rawDbUrl,
  JWT_SECRET: _env.data.JWT_SECRET,
};
export type EnvType = typeof env;
