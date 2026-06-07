import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query('ALTER TABLE customers ADD CONSTRAINT unique_company_phone UNIQUE (company_id, phone);');
    console.log('Constraint added successfully');
  } catch (err: any) {
    if (err.code === '42P07') {
      console.log('Constraint already exists or relation exists');
    } else {
      console.error(err);
    }
  } finally {
    pool.end();
  }
}
run();
