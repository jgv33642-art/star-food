const { Pool } = require('pg');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
let dbUrl = dbUrlMatch ? dbUrlMatch[1] : '';
if (!dbUrl) {
  const backupMatch = envContent.match(/DATABASE_URL=([^\s]+)/);
  if (backupMatch) dbUrl = backupMatch[1];
}

const pool = new Pool({
  connectionString: dbUrl.split('?')[0],
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query("DELETE FROM companies WHERE name ILIKE 'teste' RETURNING *");
    console.log("Deleted companies:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}
run();
