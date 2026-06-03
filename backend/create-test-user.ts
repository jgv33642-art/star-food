import { config } from 'dotenv';
config();
import { pool } from './src/config/db';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    console.log('Criando empresa e usuário de teste com Plano PRO...');
    
    // Create company with PRO plan
    const companyRes = await pool.query(
      `INSERT INTO companies (name, plan) VALUES ($1, $2) RETURNING id`,
      ['Lanchonete Teste Pro', 'pro']
    );
    const companyId = companyRes.rows[0].id;

    // Get Admin Role
    const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', ['gerencia']);
    let roleId;
    if (roleRes.rows.length === 0) {
      // Create role if doesn't exist
      const newRole = await pool.query('INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id', ['gerencia', 'Gerente']);
      roleId = newRole.rows[0].id;
    } else {
      roleId = roleRes.rows[0].id;
    }

    // Create User
    const email = 'admin@teste.com';
    const password = '123';
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query(
      'INSERT INTO users (company_id, role_id, name, email, password) VALUES ($1, $2, $3, $4, $5)',
      [companyId, roleId, 'Administrador', email, hashedPassword]
    );

    console.log('✅ Usuário criado com sucesso!');
    console.log('--------------------------------------------------');
    console.log('Acesso ao sistema:');
    console.log('E-mail: admin@teste.com');
    console.log('Senha: 123');
    console.log('Plano: PRO (Acesso total desbloqueado)');
    console.log('--------------------------------------------------');
    
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();
