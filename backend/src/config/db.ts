import { Pool } from 'pg';
import { env } from './env';

const isLocal = (env.DATABASE_URL || '').includes('localhost') || (env.DATABASE_URL || '').includes('127.0.0.1');

export let pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: isLocal ? undefined : { rejectUnauthorized: false }
});

export function updatePool(connectionString: string) {
  try {
    pool.end().catch(err => console.error('Erro ao fechar pool anterior:', err));
  } catch (err) {
    console.error('Erro ao tentar fechar o pool:', err);
  }
  const isStringLocal = (connectionString || '').includes('localhost') || (connectionString || '').includes('127.0.0.1');
  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: isStringLocal ? undefined : { rejectUnauthorized: false }
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
