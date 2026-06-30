import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';

export class CompanyController {
  getMyCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;

      // 1. Get company details
      const companyRes = await pool.query(
        'SELECT id, name, plan, extra_cashiers, extra_managers, extra_waiters FROM companies WHERE id = $1',
        [companyId]
      );
      if (!companyRes.rowCount || companyRes.rowCount === 0) {
        return res.status(404).json({ message: 'Empresa não encontrada.' });
      }

      const company = companyRes.rows[0];

      // 2. Count active users by role name
      const countsRes = await pool.query(
        `SELECT r.name as role, COUNT(u.id) as count
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.company_id = $1 AND u.active = true
         GROUP BY r.name`,
        [companyId]
      );

      const counts = {
        admin: 0,
        manager: 0,
        cashier: 0,
        waiter: 0
      };

      countsRes.rows.forEach(row => {
        if (row.role in counts) {
          counts[row.role as keyof typeof counts] = parseInt(row.count, 10);
        }
      });

      // Combine admin and manager count as "gerencia"
      const currentManagers = counts.admin + counts.manager;
      const currentCashiers = counts.cashier;
      const currentWaiters = counts.waiter;

      res.json({
        id: company.id,
        name: company.name,
        plan: company.plan,
        extra_cashiers: company.extra_cashiers || 0,
        extra_managers: company.extra_managers || 0,
        extra_waiters: company.extra_waiters || 0,
        usage: {
          managers: currentManagers,
          cashiers: currentCashiers,
          waiters: currentWaiters
        },
        limits: {
          managers: company.plan === 'pro' ? null : 1 + (company.extra_managers || 0),
          cashiers: company.plan === 'pro' ? null : 1 + (company.extra_cashiers || 0),
          waiters: company.plan === 'pro' ? null : 4 + (company.extra_waiters || 0) // Limit is 4!
        }
      });
    } catch (error) {
      next(error);
    }
  };

  upgradePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const { plan } = req.body; // 'basic' or 'pro'

      if (plan !== 'basic' && plan !== 'pro') {
        return res.status(400).json({ message: 'Plano inválido.' });
      }

      const result = await pool.query(
        'UPDATE companies SET plan = $1, updated_at = now() WHERE id = $2 RETURNING id, name, plan',
        [plan, companyId]
      );

      res.json({
        message: `Plano atualizado para ${plan === 'pro' ? 'Pro' : 'Básico'} com sucesso!`,
        company: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  };

  purchaseSeats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const { role, quantity = 1 } = req.body; // 'manager', 'cashier', 'waiter'

      if (!['manager', 'cashier', 'waiter'].includes(role)) {
        return res.status(400).json({ message: 'Cargo de vaga inválido.' });
      }

      let column = '';
      if (role === 'manager') column = 'extra_managers';
      else if (role === 'cashier') column = 'extra_cashiers';
      else if (role === 'waiter') column = 'extra_waiters';

      const query = `
        UPDATE companies 
        SET ${column} = COALESCE(${column}, 0) + $1, updated_at = now()
        WHERE id = $2 
        RETURNING id, name, plan, extra_cashiers, extra_managers, extra_waiters
      `;

      const result = await pool.query(query, [quantity, companyId]);

      res.json({
        message: `Compra de ${quantity} vaga(s) para ${role === 'manager' ? 'Dono/Gerente' : role === 'cashier' ? 'Caixa' : 'Garçom'} realizada com sucesso!`,
        company: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  };

  getDeliverySettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const result = await pool.query('SELECT whatsapp_number, operating_hours, is_delivery_open, delivery_fee FROM companies WHERE id = $1', [companyId]);
      res.json(result.rows[0]);
    } catch (error) { next(error); }
  }

  updateDeliverySettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const { whatsapp_number, operating_hours, is_delivery_open, delivery_fee } = req.body;
      const result = await pool.query(
        'UPDATE companies SET whatsapp_number = $1, operating_hours = $2, is_delivery_open = $3, delivery_fee = $4, updated_at = now() WHERE id = $5 RETURNING whatsapp_number, operating_hours, is_delivery_open, delivery_fee',
        [whatsapp_number, operating_hours, is_delivery_open, delivery_fee, companyId]
      );
      res.json(result.rows[0]);
    } catch (error) { next(error); }
  }

  getCoupons = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const result = await pool.query('SELECT * FROM coupons WHERE company_id = $1 ORDER BY created_at DESC', [companyId]);
      res.json(result.rows);
    } catch (error) { next(error); }
  }

  createCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const { code, discount_type, discount_value } = req.body;
      const result = await pool.query(
        'INSERT INTO coupons (company_id, code, discount_type, discount_value) VALUES ($1, $2, $3, $4) RETURNING *',
        [companyId, code.toUpperCase().trim(), discount_type, discount_value]
      );
      res.status(201).json(result.rows[0]);
    } catch (error: any) { 
      if (error.message?.includes('unique_company_code')) {
         return res.status(400).json({message: 'Já existe um cupom com este código'});
      }
      next(error); 
    }
  }

  toggleCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const { id } = req.params;
      const result = await pool.query('UPDATE coupons SET active = NOT active WHERE id = $1 AND company_id = $2 RETURNING *', [id, companyId]);
      res.json(result.rows[0]);
    } catch (error) { next(error); }
  }
}
