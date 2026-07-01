const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgres://postgres.xxx:xxx@aws-0-sa-east-1.pooler.supabase.com:6543/postgres', // We'll grab from env if needed
  ssl: { rejectUnauthorized: false }
});

// we will parse env file to get true connection string
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
let dbUrl = dbUrlMatch ? dbUrlMatch[1] : '';

if (!dbUrl) {
  const backupMatch = envContent.match(/DATABASE_URL=([^\s]+)/);
  if (backupMatch) dbUrl = backupMatch[1];
}

const finalPool = new Pool({
  connectionString: dbUrl.split('?')[0],
  ssl: { rejectUnauthorized: false }
});

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function createAccount() {
  try {
    const companyName = "urbs drinks";
    const password = "336421";
    const slug = slugify(companyName);
    const ghostEmail = `${slug}@starfood.local`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Company
    const companyRes = await finalPool.query(
      `INSERT INTO companies (name, plan, subscription_status) VALUES ($1, $2, $3) RETURNING id`,
      [companyName, 'pro', 'active']
    );
    const companyId = companyRes.rows[0].id;

    // Get Admin Role
    const roleRes = await finalPool.query(`SELECT id FROM roles WHERE name = 'admin'`);
    const roleId = roleRes.rows[0].id;

    // Create User
    await finalPool.query(
      `INSERT INTO users (company_id, role_id, name, email, password, active) 
       VALUES ($1, $2, $3, $4, $5, true)`,
      [companyId, roleId, companyName, ghostEmail, hashedPassword]
    );

    console.log(`Account created successfully! Company ID: ${companyId}`);
  } catch (err) {
    console.error("Error creating account:", err);
  } finally {
    await finalPool.end();
  }
}

createAccount();
