import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const staffSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.'),
  role: z.enum(['cashier', 'waiter', 'manager', 'admin']),
  pin: z.string().regex(/^\d{3,}$/, 'O PIN/Senha deve conter apenas números e no mínimo 3 dígitos.'),
});

export class SaasController {
  /**
   * Lista todas as empresas e as une com informações de plano e receita
   */
  listTenants = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        `SELECT id, name, active, plan, created_at, extra_cashiers, extra_managers, extra_waiters 
         FROM companies 
         ORDER BY created_at DESC`
      );
      
      // Mapear preços aproximados para exibir no painel (MRR)
      const mapped = result.rows.map(company => {
        let mrr = 0;
        if (company.plan === 'pro') mrr = 349.90;
        else if (company.plan === 'basic') mrr = 299.90;
        else mrr = 149.90;

        return {
          ...company,
          mrr,
          status: company.active ? 'Ativo' : 'Inativo'
        };
      });

      res.json(mapped);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lista os funcionários de uma empresa específica
   */
  listTenantUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // company id
      const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.active, u.created_at, r.name as role 
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.company_id = $1
         ORDER BY u.created_at DESC`,
        [id]
      );
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Adiciona um usuário a uma empresa específica
   */
  createTenantUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.params.id;
      const parsed = staffSchema.safeParse(req.body);
      
      if (!parsed.success) {
        const msg = parsed.error.errors[0]?.message || 'Dados inválidos.';
        return res.status(400).json({ message: msg });
      }
      
      const { name, role, pin } = parsed.data;

      // Pegar o role_id
      const roleResult = await pool.query('SELECT id, name FROM roles WHERE name = $1', [role]);
      if (!roleResult.rowCount || roleResult.rowCount === 0) {
        return res.status(400).json({ message: 'Cargo inválido.' });
      }
      const targetRoleId = roleResult.rows[0].id;
      const roleName = roleResult.rows[0].name;

      // Hash da senha (PIN)
      const salt = await bcrypt.genSalt(10);
      const hashedPin = await bcrypt.hash(pin, salt);

      // Criar pseudo-email para não violar a constraint unique se for cashier/waiter
      // Se for manager/admin, a pessoa normalmente precisa do e-mail real para logar, mas 
      // como o SAAS está criando para ajudar, podemos usar o próprio PIN para login ou pseudo.
      // Vamos criar sempre com um pseudo-email único baseado no ID da empresa e nome para login.
      const timestamp = Date.now().toString().slice(-6);
      const sanitizedName = name.replace(/\s+/g, '').toLowerCase().substring(0, 10);
      const pseudoEmail = `${sanitizedName}${timestamp}@sistemasaas.local`;

      const insertResult = await pool.query(
        `INSERT INTO users (company_id, role_id, name, email, password)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, active`,
        [companyId, targetRoleId, name, pseudoEmail, hashedPin]
      );

      res.status(201).json({ ...insertResult.rows[0], role: roleName });
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'E-mail ou nome já cadastrado em conflito.' });
      }
      next(error);
    }
  };
}
