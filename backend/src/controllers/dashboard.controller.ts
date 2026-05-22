import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';

export class DashboardController {
  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;

      const [todayRevenue, monthRevenue, avgTicket, activeOrders, tablesInfo] = await Promise.all([
        pool.query(
          `SELECT COALESCE(SUM(final_amount), 0) AS value
           FROM sales
           WHERE company_id = $1 AND DATE(created_at) = CURRENT_DATE`,
          [companyId]
        ),
        pool.query(
          `SELECT COALESCE(SUM(final_amount), 0) AS value
           FROM sales
           WHERE company_id = $1 AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`,
          [companyId]
        ),
        pool.query(
          `SELECT COALESCE(AVG(final_amount), 0) AS value
           FROM sales
           WHERE company_id = $1`,
          [companyId]
        ),
        pool.query(
          `SELECT COUNT(*) AS value
           FROM orders
           WHERE company_id = $1 AND status = 'open'`,
          [companyId]
        ),
        pool.query(
          `SELECT
             COUNT(*) AS total,
             COUNT(CASE WHEN status = 'occupied' THEN 1 END) AS occupied
           FROM tables
           WHERE company_id = $1`,
          [companyId]
        ),
      ]);

      res.json({
        today_revenue: parseFloat(todayRevenue.rows[0].value),
        month_revenue: parseFloat(monthRevenue.rows[0].value),
        avg_ticket: parseFloat(parseFloat(avgTicket.rows[0].value).toFixed(2)),
        active_orders: parseInt(activeOrders.rows[0].value, 10),
        open_tables: parseInt(tablesInfo.rows[0].total, 10) - parseInt(tablesInfo.rows[0].occupied, 10),
        total_tables: parseInt(tablesInfo.rows[0].total, 10),
      });
    } catch (error) {
      next(error);
    }
  };
}
