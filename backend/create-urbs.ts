import { config } from 'dotenv';
config();
import { pool } from './src/config/db';
import bcrypt from 'bcryptjs';

async function createUrbsUser() {
  try {
    console.log('Criando empresa Urbs Drinks (PRO)...');
    
    // Create company with PRO plan
    const companyRes = await pool.query(
      `INSERT INTO companies (name, plan, subscription_status) VALUES ($1, $2, $3) RETURNING id`,
      ['urbs drinks', 'pro', 'active']
    );
    const companyId = companyRes.rows[0].id;

    // Get Admin Role
    const roleRes = await pool.query("SELECT id FROM roles WHERE name = 'admin'");
    let roleId;
    if (roleRes.rows.length === 0) {
      const newRole = await pool.query("INSERT INTO roles (name, description) VALUES ('admin', 'Admin') RETURNING id");
      roleId = newRole.rows[0].id;
    } else {
      roleId = roleRes.rows[0].id;
    }

    // Create User
    const email = 'urbsdrinks@starfood.local';
    const password = '336421';
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query(
      'INSERT INTO users (company_id, role_id, name, email, password, active) VALUES ($1, $2, $3, $4, $5, true)',
      [companyId, roleId, 'urbs drinks', email, hashedPassword]
    );

    console.log('✅ Usuário criado com sucesso!');
    console.log('Acesso ao sistema:');
    console.log('Estabelecimento: urbs drinks');
    console.log('Senha: ' + password);
    
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
  } finally {
    await pool.end();
  }
}

createUrbsUser();
