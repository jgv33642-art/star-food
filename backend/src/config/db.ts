import { Pool } from 'pg';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

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
