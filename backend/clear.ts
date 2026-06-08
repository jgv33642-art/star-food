import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL.split('?')[0],
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM companies');
    console.log('Contas apagadas com sucesso!');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
