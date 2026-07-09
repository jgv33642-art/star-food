import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function clearDatabase() {
  try {
    console.log('Conectando ao banco de dados...');
    
    // Apaga todos os dados das tabelas, mas mantém a estrutura
    await pool.query(`
      TRUNCATE TABLE users CASCADE;
      TRUNCATE TABLE companies CASCADE;
    `);
    
    console.log('✅ Todas as contas e estabelecimentos foram apagados com sucesso!');
    console.log('Você já pode usar os mesmos e-mails novamente para testar.');
  } catch (error) {
    console.error('Erro ao limpar o banco de dados:', error);
  } finally {
    await pool.end();
  }
}

clearDatabase();
