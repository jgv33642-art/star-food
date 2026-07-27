const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query("ALTER TABLE categories ADD COLUMN IF NOT EXISTS printer_sector VARCHAR(50) DEFAULT 'kitchen';");
    await pool.query("ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS printer_kitchen_ip VARCHAR(255);");
    await pool.query("ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS printer_bar_ip VARCHAR(255);");
    await pool.query("ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS printer_cashier_ip VARCHAR(255);");
    console.log('Database updated successfully');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
