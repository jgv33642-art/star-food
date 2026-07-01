const { Pool } = require('pg');
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

const defaultCategories = ['Bebidas', 'Drinks', 'Porções', 'Lanches', 'Combos', 'Sobremesas', 'Adicionais'];

async function seed() {
  try {
    const companiesRes = await finalPool.query('SELECT id FROM companies');
    for (const company of companiesRes.rows) {
      for (const cat of defaultCategories) {
        const check = await finalPool.query('SELECT id FROM categories WHERE name = $1 AND company_id = $2', [cat, company.id]);
        if (check.rows.length === 0) {
          await finalPool.query('INSERT INTO categories (name, company_id) VALUES ($1, $2)', [cat, company.id]);
        }
      }
    }
    console.log("Categories seeded successfully!");
  } catch (err) {
    console.error("Error seeding categories:", err);
  } finally {
    await finalPool.end();
  }
}

seed();
