import { pool } from '../config/db';

export class CashierRepository {
  async findCurrent(companyId: string) {
    const result = await pool.query(
      `SELECT * FROM cash_registers WHERE company_id = $1 AND status = 'open' ORDER BY opened_at DESC LIMIT 1`,
      [companyId]
    );
    return result.rows[0];
  }

  async open(companyId: string, userId: string, openingBalance: number) {
    const result = await pool.query(
      `INSERT INTO cash_registers (company_id, opened_by, opening_balance, status, opened_at)
       VALUES ($1, $2, $3, 'open', now()) RETURNING *`,
      [companyId, userId, openingBalance]
    );
    return result.rows[0];
  }

  async close(companyId: string, id: string, userId: string, closingBalance: number) {
    const result = await pool.query(
      `UPDATE cash_registers
       SET closed_by = $1, closing_balance = $2, status = 'closed', closed_at = now()
       WHERE id = $3 AND company_id = $4 RETURNING *`,
      [userId, closingBalance, id, companyId]
    );
    return result.rows[0];
  }
}
