import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.string().optional().default('3000'),
  DATABASE_URL: z.string().optional(),
  POSTGRES_URL: z.string().optional(),
  POSTGRES_URL_NON_POOLING: z.string().optional(),
  JWT_SECRET: z.string().optional().default('star-food-secret-jwt-token-fallback'),
  NODE_ENV: z.string().optional().default('development'),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional().default('APP_USR-2727821531199974-052815-b2193866b97800eb640a747a99f326f2-3432268245'),
  MERCADO_PAGO_PUBLIC_KEY: z.string().optional().default('APP_USR-d415a207-6e9f-49c8-8614-48d75cb3565b'),
}).passthrough();

const _env = envSchema.safeParse(process.env);

let envData: any = {};
if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  envData = process.env; // Fallback to raw process.env to prevent crashes
} else {
  envData = _env.data;
}

// Extract valid database URL from available envs
const rawDbUrl = envData.DATABASE_URL || envData.POSTGRES_URL || envData.POSTGRES_URL_NON_POOLING;

if (!rawDbUrl) {
  console.error('❌ Database connection string not found. Please provide DATABASE_URL or POSTGRES_URL.');
}

export const env = {
  ...envData,
  DATABASE_URL: rawDbUrl,
  JWT_SECRET: envData.JWT_SECRET || 'star-food-secret-jwt-token-fallback',
  MERCADO_PAGO_ACCESS_TOKEN: envData.MERCADO_PAGO_ACCESS_TOKEN || 'APP_USR-2727821531199974-052815-b2193866b97800eb640a747a99f326f2-3432268245',
  MERCADO_PAGO_PUBLIC_KEY: envData.MERCADO_PAGO_PUBLIC_KEY || 'APP_USR-d415a207-6e9f-49c8-8614-48d75cb3565b',
};
export type EnvType = typeof env;
