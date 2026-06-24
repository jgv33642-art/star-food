import { pool } from '../config/db';

export class SaleRepository {
  async findAll(companyId: string) {
    const result = await pool.query(
      `SELECT
        s.id, s.company_id, s.order_id, s.cash_register_id, s.customer_id,
        s.total_amount, s.discount, s.final_amount, s.status, s.created_at,
        COALESCE((SELECT method FROM payments WHERE sale_id = s.id LIMIT 1), 'dinheiro') AS payment_method,
        COALESCE(
          json_agg(
            json_build_object(
              'id', si.id,
              'product_id', si.product_id,
              'product_name', p.name,
              'quantity', si.quantity,
              'price', si.price
            )
          ) FILTER (WHERE si.id IS NOT NULL),
          '[]'
        ) AS items
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN products p ON p.id = si.product_id
      WHERE s.company_id = $1
      GROUP BY s.id
      ORDER BY s.created_at DESC`,
      [companyId]
    );
    return result.rows;
  }

  async findById(companyId: string, id: string) {
    const result = await pool.query(
      `SELECT
        s.id, s.company_id, s.order_id, s.cash_register_id, s.customer_id,
        s.total_amount, s.discount, s.final_amount, s.status, s.created_at,
        COALESCE((SELECT method FROM payments WHERE sale_id = s.id LIMIT 1), 'dinheiro') AS payment_method,
        COALESCE(
          json_agg(
            json_build_object(
              'id', si.id,
              'product_id', si.product_id,
              'product_name', p.name,
              'quantity', si.quantity,
              'price', si.price
            )
          ) FILTER (WHERE si.id IS NOT NULL),
          '[]'
        ) AS items
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN products p ON p.id = si.product_id
      WHERE s.id = $1 AND s.company_id = $2
      GROUP BY s.id`,
      [id, companyId]
    );
    return result.rows[0];
  }

  async create(
    companyId: string,
    data: {
      orderId?: string;
      cashRegisterId?: string;
      customerId?: string;
      totalAmount: number;
      discount: number;
      finalAmount: number;
      paymentMethod?: string;
      payments?: { method: string; amount: number; receivedAmount?: number }[];
      items: { productId: string; quantity: number; price: number }[];
    }
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { orderId, cashRegisterId, customerId, totalAmount, discount, finalAmount, paymentMethod, payments, items } = data;

      const saleResult = await client.query(
        `INSERT INTO sales (company_id, order_id, cash_register_id, customer_id, total_amount, discount, final_amount, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'paid') RETURNING *`,
        [companyId, orderId || null, cashRegisterId || null, customerId || null, totalAmount, discount, finalAmount]
      );
      const sale = saleResult.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
          [sale.id, item.productId, item.quantity, item.price]
        );
        
        // Baixa automática no estoque de produtos (opcional)
        await client.query(
          `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND company_id = $3`,
          [item.quantity, item.productId, companyId]
        );

        // Baixa automática na Ficha Técnica (Ingredientes)
        const ingredientsRes = await client.query(
          `SELECT ingredient_id, quantity FROM product_ingredients WHERE product_id = $1`,
          [item.productId]
        );
        
        for (const ing of ingredientsRes.rows) {
          const totalDeduction = ing.quantity * item.quantity;
          await client.query(
            `UPDATE ingredients SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND company_id = $3`,
            [totalDeduction, ing.ingredient_id, companyId]
          );
        }
      }

      // Insert payment record
      if (payments && payments.length > 0) {
        for (const pmt of payments) {
          const changeAmount = pmt.method === 'cash' && pmt.receivedAmount
            ? Math.max(0, pmt.receivedAmount - pmt.amount)
            : 0;
          await client.query(
            `INSERT INTO payments (sale_id, method, amount, change_amount) VALUES ($1, $2, $3, $4)`,
            [sale.id, pmt.method, pmt.amount, changeAmount]
          );
        }
      } else {
        await client.query(
          `INSERT INTO payments (sale_id, method, amount) VALUES ($1, $2, $3)`,
          [sale.id, paymentMethod || 'dinheiro', finalAmount]
        );
      }

      // Loyalty Program Logic
      if (orderId) {
        const orderRes = await client.query('SELECT customer_name, customer_phone FROM orders WHERE id = $1', [orderId]);
        if (orderRes.rows.length > 0) {
          const { customer_name, customer_phone } = orderRes.rows[0];
          if (customer_phone) {
            // Points: 1 point per Real
            const pointsToadd = Math.floor(finalAmount);
            
            // Upsert customer by phone
            await client.query(`
              INSERT INTO customers (company_id, name, phone, loyalty_points)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (company_id, phone) DO UPDATE
              SET loyalty_points = customers.loyalty_points + EXCLUDED.loyalty_points,
                  name = COALESCE(EXCLUDED.name, customers.name)
            `, [companyId, customer_name || 'Cliente', customer_phone, pointsToadd]);
          }
        }
      }

      await client.query('COMMIT');
      return sale;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
