import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';

export class ReportsController {

  // ── Módulo 7: Top Produtos Mais Vendidos ────────────────────────────────────
  topProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const limit = parseInt(req.query.limit as string) || 10;
      const from = req.query.from as string || new Date(Date.now() - 30 * 86400000).toISOString();
      const to   = req.query.to   as string || new Date().toISOString();

      const result = await pool.query(`
        SELECT
          p.id,
          p.name,
          p.price,
          COALESCE(p.cost, 0)                              AS cost,
          SUM(oi.quantity)                                 AS qty_sold,
          SUM(oi.quantity * oi.price)                      AS revenue,
          SUM(oi.quantity * COALESCE(p.cost, 0))           AS total_cost,
          SUM(oi.quantity * (oi.price - COALESCE(p.cost,0))) AS gross_profit
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders   o ON oi.order_id   = o.id
        WHERE o.company_id = $1
          AND o.status      = 'closed'
          AND o.created_at BETWEEN $2 AND $3
        GROUP BY p.id, p.name, p.price, p.cost
        ORDER BY qty_sold DESC
        LIMIT $4
      `, [companyId, from, to, limit]);

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  };

  // ── Módulo 5: CMV por produto ───────────────────────────────────────────────
  cmv = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const from = req.query.from as string || new Date(Date.now() - 30 * 86400000).toISOString();
      const to   = req.query.to   as string || new Date().toISOString();

      const result = await pool.query(`
        SELECT
          p.id,
          p.name,
          SUM(oi.quantity)                                           AS qty_sold,
          SUM(oi.quantity * oi.price)                                AS revenue,
          SUM(oi.quantity * COALESCE(p.cost, 0))                     AS total_cost,
          SUM(oi.quantity * (oi.price - COALESCE(p.cost, 0)))        AS gross_profit,
          ROUND(
            CASE
              WHEN SUM(oi.quantity * oi.price) = 0 THEN 0
              ELSE SUM(oi.quantity * COALESCE(p.cost, 0)) /
                   SUM(oi.quantity * oi.price) * 100
            END, 2
          ) AS cmv_pct,
          ROUND(
            CASE
              WHEN SUM(oi.quantity * oi.price) = 0 THEN 0
              ELSE (SUM(oi.quantity * (oi.price - COALESCE(p.cost,0)))) /
                   SUM(oi.quantity * oi.price) * 100
            END, 2
          ) AS margin_pct
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders   o ON oi.order_id   = o.id
        WHERE o.company_id = $1
          AND o.status      = 'closed'
          AND o.created_at BETWEEN $2 AND $3
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
      `, [companyId, from, to]);

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  };

  // ── Módulo 5: Resumo geral CMV ──────────────────────────────────────────────
  cmvSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const from = req.query.from as string || new Date(Date.now() - 30 * 86400000).toISOString();
      const to   = req.query.to   as string || new Date().toISOString();

      const result = await pool.query(`
        SELECT
          COUNT(DISTINCT o.id)                                         AS total_orders,
          SUM(oi.quantity * oi.price)                                  AS total_revenue,
          SUM(oi.quantity * COALESCE(p.cost, 0))                       AS total_cost,
          SUM(oi.quantity * (oi.price - COALESCE(p.cost, 0)))          AS total_profit,
          ROUND(
            CASE
              WHEN SUM(oi.quantity * oi.price) = 0 THEN 0
              ELSE SUM(oi.quantity * COALESCE(p.cost, 0)) /
                   SUM(oi.quantity * oi.price) * 100
            END, 2
          ) AS cmv_pct,
          ROUND(
            CASE
              WHEN SUM(oi.quantity * oi.price) = 0 THEN 0
              ELSE (SUM(oi.quantity * (oi.price - COALESCE(p.cost,0)))) /
                   SUM(oi.quantity * oi.price) * 100
            END, 2
          ) AS margin_pct
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders   o ON oi.order_id   = o.id
        WHERE o.company_id = $1
          AND o.status      = 'closed'
          AND o.created_at BETWEEN $2 AND $3
      `, [companyId, from, to]);

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  };

  // ── Módulo 6: Produtos com estoque mínimo atingido ──────────────────────────
  lowStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;

      const result = await pool.query(`
        SELECT
          id,
          name,
          stock_quantity,
          minimum_stock,
          (minimum_stock - stock_quantity) AS deficit
        FROM products
        WHERE company_id  = $1
          AND active      = true
          AND minimum_stock IS NOT NULL
          AND minimum_stock > 0
          AND stock_quantity <= minimum_stock
        ORDER BY (stock_quantity::float / NULLIF(minimum_stock,0)) ASC
      `, [companyId]);

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  };
}
