import { Pool } from 'pg';
import { env } from './env';

export let pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production' || (env.DATABASE_URL || '').includes('supabase') ? { rejectUnauthorized: false } : undefined
});

export function updatePool(connectionString: string) {
  try {
    pool.end().catch(err => console.error('Erro ao fechar pool anterior:', err));
  } catch (err) {
    console.error('Erro ao tentar fechar o pool:', err);
  }
  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production' || (connectionString || '').includes('supabase') ? { rejectUnauthorized: false } : undefined
  });
}

/**
 * Executes a query with Row Level Security (RLS) configured for the given company_id
 */
export async function queryWithRLS(companyId: string | undefined, text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    if (companyId) {
      // Set the session variable so Supabase RLS works
      // using current_setting('request.jwt.claims', true)::json->>'company_id'
      await client.query(`SET LOCAL request.jwt.claims = '{"company_id":"${companyId}"}'`);
    } else {
      await client.query(`SET LOCAL request.jwt.claims = '{}'`);
    }
    const result = await client.query(text, params);
    return result;
  } finally {
    await client.query('RESET ALL'); // Ensure we reset settings
    client.release();
  }
}
