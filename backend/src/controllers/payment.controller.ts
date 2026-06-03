import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { emitToCompany } from '../services/socket.service';

export class PaymentController {

  /**
   * GET /orders/:id/payment-summary
   * Retorna resumo do pedido com itens, subtotal e pagamentos já realizados
   */
  summary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const orderId   = req.params.id;

      // Pedido + itens
      const orderRes = await pool.query(
        `SELECT o.*, t.number AS table_number
         FROM orders o
         LEFT JOIN tables t ON o.table_id = t.id
         WHERE o.id = $1 AND o.company_id = $2`,
        [orderId, companyId]
      );
      if (!orderRes.rows.length) {
        return res.status(404).json({ message: 'Pedido não encontrado.' });
      }

      const itemsRes = await pool.query(
        `SELECT oi.id, oi.quantity, oi.price, oi.notes,
                p.name AS product_name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1
         ORDER BY oi.id ASC`,
        [orderId]
      );

      // Pagamentos parciais já realizados
      const paymentsRes = await pool.query(
        `SELECT id, method, amount, change_amount, created_at
         FROM payments WHERE order_id = $1 ORDER BY created_at ASC`,
        [orderId]
      );

      const subtotal    = itemsRes.rows.reduce((sum, i) => sum + parseFloat(i.price) * parseFloat(i.quantity), 0);
      const paid        = paymentsRes.rows.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const remaining   = Math.max(0, subtotal - paid);

      res.json({
        order: orderRes.rows[0],
        items: itemsRes.rows,
        payments: paymentsRes.rows,
        subtotal,
        paid,
        remaining,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /orders/:id/pay
   * Registra um ou mais pagamentos e fecha o pedido quando pago integralmente
   *
   * Body: { payments: [{ method: 'cash'|'credit'|'debit'|'pix', amount: number, receivedAmount?: number }] }
   */
  pay = async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
      const companyId = req.user!.companyId;
      const orderId   = req.params.id;
      const { payments } = req.body as {
        payments: Array<{ method: string; amount: number; receivedAmount?: number }>
      };

      if (!payments || !Array.isArray(payments) || payments.length === 0) {
        return res.status(400).json({ message: 'Informe ao menos um pagamento.' });
      }

      await client.query('BEGIN');

      // Valida que o pedido pertence à empresa e está aberto
      const orderRes = await client.query(
        `SELECT id, status FROM orders WHERE id = $1 AND company_id = $2 FOR UPDATE`,
        [orderId, companyId]
      );
      if (!orderRes.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Pedido não encontrado.' });
      }
      if (orderRes.rows[0].status === 'closed') {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Este pedido já foi fechado.' });
      }

      // Calcula subtotal
      const itemsRes = await client.query(
        `SELECT SUM(quantity * price) AS subtotal FROM order_items WHERE order_id = $1`,
        [orderId]
      );
      const subtotal = parseFloat(itemsRes.rows[0].subtotal || '0');

      // Pagamentos já realizados
      const prevRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE order_id = $1`,
        [orderId]
      );
      const prevPaid  = parseFloat(prevRes.rows[0].paid);
      const newTotal  = payments.reduce((s, p) => s + p.amount, 0);
      const totalPaid = prevPaid + newTotal;

      if (newTotal <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Valor do pagamento deve ser maior que zero.' });
      }

      // Insere cada pagamento
      const insertedPayments = [];
      for (const pmt of payments) {
        const changeAmount = pmt.method === 'cash' && pmt.receivedAmount
          ? Math.max(0, pmt.receivedAmount - pmt.amount)
          : 0;

        const pmtRes = await client.query(
          `INSERT INTO payments (company_id, order_id, method, amount, change_amount)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [companyId, orderId, pmt.method, pmt.amount, changeAmount]
        );
        insertedPayments.push(pmtRes.rows[0]);
      }

      // Fecha pedido se totalmente pago
      let orderClosed = false;
      if (totalPaid >= subtotal) {
        await client.query(
          `UPDATE orders SET status = 'closed', updated_at = now() WHERE id = $1`,
          [orderId]
        );
        orderClosed = true;
      }

      await client.query('COMMIT');

      const response = {
        payments: insertedPayments,
        subtotal,
        totalPaid,
        remaining: Math.max(0, subtotal - totalPaid),
        orderClosed,
        change: insertedPayments.reduce((s, p) => s + parseFloat(p.change_amount || '0'), 0),
      };

      res.status(201).json(response);

      // 🔴 WebSocket: notifica caixa e dashboard
      if (orderClosed) {
        emitToCompany(companyId, 'order_closed', {
          id: orderId,
          totalPaid,
          closedAt: new Date().toISOString(),
        });
      } else {
        emitToCompany(companyId, 'order_payment_partial', {
          id: orderId,
          totalPaid,
          remaining: subtotal - totalPaid,
        });
      }

    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  };
}
