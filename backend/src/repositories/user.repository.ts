import { pool } from '../config/db';

export class UserRepository {
  async findByEmail(email: string) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  async findRoleByName(name: string) {
    const result = await pool.query('SELECT id FROM roles WHERE name = $1', [name]);
    return result.rows[0];
  }

  async createCompany(name: string) {
    const result = await pool.query(
      'INSERT INTO companies (name) VALUES ($1) RETURNING id',
      [name]
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
