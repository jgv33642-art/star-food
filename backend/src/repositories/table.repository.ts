import { pool } from '../config/db';

export class TableRepository {
  async findAll(companyId: string) {
    const result = await pool.query(
      'SELECT * FROM tables WHERE company_id = $1 ORDER BY number ASC',
      [companyId]
    );
    return result.rows;
  }

  async findById(companyId: string, id: string) {
    const result = await pool.query(
      'SELECT * FROM tables WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    return result.rows[0];
  }

  async create(companyId: string, data: any) {
    const { number, status } = data;
    const result = await pool.query(
      `INSERT INTO tables (company_id, number, status) VALUES ($1, $2, $3) RETURNING *`,
      [companyId, number, status || 'free']
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
    const query = `UPDATE tables SET ${updates.join(', ')}, updated_at = now() WHERE id = $${i} AND company_id = $${i + 1} RETURNING *`;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async delete(companyId: string, id: string) {
    const result = await pool.query(
      'DELETE FROM tables WHERE id = $1 AND company_id = $2 RETURNING id',
      [id, companyId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
