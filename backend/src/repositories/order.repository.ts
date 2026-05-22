import { pool } from '../config/db';

export class OrderRepository {
  async findAll(companyId: string) {
    const result = await pool.query(
      `SELECT
        o.id, o.company_id, o.table_id, o.waiter_id, o.status, o.opened_at, o.closed_at,
        t.number AS table_number,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'price', oi.price,
              'notes', oi.notes
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN tables t ON t.id = o.table_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.company_id = $1
      GROUP BY o.id, t.number
      ORDER BY o.opened_at DESC`,
      [companyId]
    );
    return result.rows;
  }

  async findById(companyId: string, id: string) {
    const result = await pool.query(
      `SELECT
        o.id, o.company_id, o.table_id, o.waiter_id, o.status, o.opened_at, o.closed_at,
        t.number AS table_number,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'price', oi.price,
              'notes', oi.notes
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN tables t ON t.id = o.table_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.id = $1 AND o.company_id = $2
      GROUP BY o.id, t.number`,
      [id, companyId]
    );
    return result.rows[0];
  }

  async create(companyId: string, data: { tableId?: string; waiterId?: string }) {
    const { tableId, waiterId } = data;
    const result = await pool.query(
      `INSERT INTO orders (company_id, table_id, waiter_id, status, opened_at)
       VALUES ($1, $2, $3, 'open', now()) RETURNING *`,
      [companyId, tableId || null, waiterId || null]
    );
    return result.rows[0];
  }

  async addItem(orderId: string, data: { productId: string; quantity: number; price: number; notes?: string }) {
    const { productId, quantity, price, notes } = data;
    const result = await pool.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orderId, productId, quantity, price, notes || null]
    );
    return result.rows[0];
  }

  async removeItem(orderId: string, itemId: string) {
    const result = await pool.query(
      'DELETE FROM order_items WHERE id = $1 AND order_id = $2 RETURNING id',
      [itemId, orderId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async close(companyId: string, id: string) {
    const result = await pool.query(
      `UPDATE orders SET status = 'closed', closed_at = now()
       WHERE id = $1 AND company_id = $2 RETURNING *`,
      [id, companyId]
    );
    return result.rows[0];
  }
}
