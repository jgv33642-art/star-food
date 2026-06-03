import { pool } from '../config/db';

export class UserRepository {
  async findByEmail(email: string) {
    const result = await pool.query(
      `SELECT u.*, r.name as role, c.plan as company_plan
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0];
  }

  async findRoleByName(name: string) {
    const result = await pool.query('SELECT id FROM roles WHERE name = $1', [name]);
    return result.rows[0];
  }

  async createCompany(name: string, plan: string = 'start') {
    const result = await pool.query(
      'INSERT INTO companies (name, plan) VALUES ($1, $2) RETURNING id',
      [name, plan]
    );
    return result.rows[0];
  }

  async createUser(data: any) {
    const { companyId, roleId, name, email, password } = data;
    const result = await pool.query(
      'INSERT INTO users (company_id, role_id, name, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role_id',
      [companyId, roleId, name, email, password]
    );
    return result.rows[0];
  }
}
