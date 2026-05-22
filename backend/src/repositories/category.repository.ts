import { pool } from '../config/db';

export class CategoryRepository {
  async findAll(companyId: string) {
    const result = await pool.query(
      'SELECT * FROM categories WHERE company_id = $1 ORDER BY created_at DESC',
      [companyId]
    );
    return result.rows;
  }

  async create(companyId: string, data: any) {
    const { name } = data;
    const result = await pool.query(
      `INSERT INTO categories (company_id, name) VALUES ($1, $2) RETURNING *`,
      [companyId, name]
    );
    return result.rows[0];
  }

  async update(companyId: string, id: string, data: any) {
    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        updates.push(`${snakeKey} = $${i}`);
        values.push(value);
        i++;
      }
    }

    if (updates.length === 0) return null;

    values.push(id, companyId);
    const query = `UPDATE categories SET ${updates.join(', ')}, updated_at = now() WHERE id = $${i} AND company_id = $${i + 1} RETURNING *`;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async delete(companyId: string, id: string) {
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND company_id = $2 RETURNING id',
      [id, companyId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
