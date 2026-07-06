const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clearAccounts() {
  try {
    console.log('Conectando ao banco de dados...');
    
    // Deleta todas as empresas. 
    // Como existe 'ON DELETE CASCADE' nas tabelas, isso vai limpar
    // automaticamente os usuários, produtos, pedidos, etc.
    const result = await pool.query('DELETE FROM companies');
    
    console.log(`Sucesso! Foram deletadas ${result.rowCount} contas/empresas e todos os seus dados associados.`);
  } catch (error) {
    console.error('Erro ao limpar banco de dados:', error);
  } finally {
    pool.end();
  }
}

clearAccounts();
