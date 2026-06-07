import { pool } from '../config/db';

export class CustomerRepository {
  async findAll(companyId: string) {
    const result = await pool.query(
      `SELECT id, name, phone, email, loyalty_points, created_at 
       FROM customers 
       WHERE company_id = $1 
       ORDER BY loyalty_points DESC`,
      [companyId]
    );
    return result.rows;
  }
}
