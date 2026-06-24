import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Zod schema para cadastro rápido via PIN
const staffSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.'),
  role: z.enum(['cashier', 'waiter'], { errorMap: () => ({ message: 'Cargo deve ser caixa ou garçom.' }) }),
  pin: z.string().regex(/^\d{3,}$/, 'O PIN deve conter apenas números e no mínimo 3 dígitos.'),
});


export class UserController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.active, u.created_at, r.name as role 
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.company_id = $1
         ORDER BY u.created_at DESC`,
        [companyId]
      );
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const { name, email, password, role } = req.body; // role: 'admin', 'manager', 'cashier', 'waiter'

      // 1. Get role from database
      const roleResult = await pool.query('SELECT id, name FROM roles WHERE name = $1', [role]);
      if (!roleResult.rowCount || roleResult.rowCount === 0) {
        return res.status(400).json({ message: 'Cargo inválido. Escolha admin, manager, cashier ou waiter.' });
      }
      const targetRoleId = roleResult.rows[0].id;
      const roleName = roleResult.rows[0].name;

      // 2. Fetch company plan and seat limits
      const companyRes = await pool.query(
        'SELECT plan, extra_cashiers, extra_managers, extra_waiters FROM companies WHERE id = $1',
        [companyId]
      );
      if (!companyRes.rowCount || companyRes.rowCount === 0) {
        return res.status(404).json({ message: 'Empresa não encontrada.' });
      }

      const { plan, extra_cashiers, extra_managers, extra_waiters } = companyRes.rows[0];

      if (plan !== 'pro') {
        // Count active users with the target role in the company
        const countRes = await pool.query(
          `SELECT COUNT(*) FROM users u
           JOIN roles r ON u.role_id = r.id
           WHERE u.company_id = $1 AND r.name = $2 AND u.active = true`,
          [companyId, roleName]
        );
        const currentCount = parseInt(countRes.rows[0].count, 10);

        let limit = 0;
        let roleDisplayName = '';
        if (roleName === 'admin' || roleName === 'manager') {
          limit = 1 + (extra_managers || 0);
          roleDisplayName = 'Dono/Gerente';
        } else if (roleName === 'cashier') {
          limit = 1 + (extra_cashiers || 0);
          roleDisplayName = 'Caixa';
        } else if (roleName === 'waiter') {
          limit = 4 + (extra_waiters || 0); // Limit is 4!
          roleDisplayName = 'Garçom';
        }

        if (limit > 0 && currentCount >= limit) {
          return res.status(400).json({
            message: `Limite atingido! Você possui ${currentCount} de ${limit} acessos permitidos para o cargo de ${roleDisplayName}. Adquira mais vagas ou faça upgrade para o plano Pro.`
          });
        }
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const insertResult = await pool.query(
        `INSERT INTO users (company_id, role_id, name, email, password)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, active`,
        [companyId, targetRoleId, name, email, hashedPassword]
      );

      res.status(201).json({ ...insertResult.rows[0], role: roleName });
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation for email
        return res.status(400).json({ message: 'E-mail já cadastrado.' });
      }
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const { id } = req.params;
      const { name, email, role, active, password } = req.body;

      // Get target role id
      let targetRoleId = null;
      let roleName = null;
      if (role) {
        const roleResult = await pool.query('SELECT id, name FROM roles WHERE name = $1', [role]);
        if (!roleResult.rowCount || roleResult.rowCount === 0) {
          return res.status(400).json({ message: 'Cargo inválido.' });
        }
        targetRoleId = roleResult.rows[0].id;
        roleName = roleResult.rows[0].name;
      }

      // If updating role or reactivating user, check plan limits
      if (roleName || active === true) {
        let checkRoleName = roleName;
        if (!checkRoleName) {
          const userRoleRes = await pool.query(
            `SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1 AND u.company_id = $2`,
            [id, companyId]
          );
          if (userRoleRes.rowCount && userRoleRes.rowCount > 0) {
            checkRoleName = userRoleRes.rows[0].name;
          }
        }

        const companyRes = await pool.query(
          'SELECT plan, extra_cashiers, extra_managers, extra_waiters FROM companies WHERE id = $1',
          [companyId]
        );
        if (companyRes.rowCount && companyRes.rowCount > 0 && companyRes.rows[0].plan !== 'pro' && checkRoleName) {
          // Count active users with checkRoleName *except the user being updated*
          const countRes = await pool.query(
            `SELECT COUNT(*) FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.company_id = $1 AND r.name = $2 AND u.active = true AND u.id != $3`,
            [companyId, checkRoleName, id]
          );
          const currentCount = parseInt(countRes.rows[0].count, 10);

          let limit = 0;
          let roleDisplayName = '';
          if (checkRoleName === 'admin' || checkRoleName === 'manager') {
            limit = 1 + (companyRes.rows[0].extra_managers || 0);
            roleDisplayName = 'Dono/Gerente';
          } else if (checkRoleName === 'cashier') {
            limit = 1 + (companyRes.rows[0].extra_cashiers || 0);
            roleDisplayName = 'Caixa';
          } else if (checkRoleName === 'waiter') {
            limit = 4 + (companyRes.rows[0].extra_waiters || 0); // Limit is 4!
            roleDisplayName = 'Garçom';
          }

          if (limit > 0 && currentCount >= limit) {
            return res.status(400).json({
              message: `Limite atingido! Você possui ${currentCount} de ${limit} acessos permitidos para o cargo de ${roleDisplayName}. Adquira mais vagas ou faça upgrade para o plano Pro.`
            });
          }
        }
      }

      // Update fields
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (name !== undefined) {
        updates.push(`name = $${idx++}`);
        values.push(name);
      }
      if (email !== undefined) {
        updates.push(`email = $${idx++}`);
        values.push(email);
      }
      if (targetRoleId !== null) {
        updates.push(`role_id = $${idx++}`);
        values.push(targetRoleId);
      }
      if (active !== undefined) {
        updates.push(`active = $${idx++}`);
        values.push(active);
      }
      if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        updates.push(`password = $${idx++}`);
        values.push(hashedPassword);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo para atualizar.' });
      }

      values.push(id);
      values.push(companyId);

      const updateQuery = `
        UPDATE users 
        SET ${updates.join(', ')}, updated_at = now()
        WHERE id = $${idx++} AND company_id = $${idx++}
        RETURNING id, name, email, active
      `;

      const result = await pool.query(updateQuery, values);
      if (!result.rowCount || result.rowCount === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      // Get updated user's role
      const updatedUserRes = await pool.query(
        `SELECT u.id, u.name, u.email, u.active, r.name as role 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = $1`, 
        [id]
      );

      res.json(updatedUserRes.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'E-mail já cadastrado.' });
      }
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const { id } = req.params;

      if (id === req.user?.userId) {
        return res.status(400).json({ message: 'Você não pode excluir a si mesmo!' });
      }

      // Soft delete: set active = false
      const result = await pool.query(
        'UPDATE users SET active = false, updated_at = now() WHERE id = $1 AND company_id = $2 RETURNING id',
        [id, companyId]
      );

      if (!result.rowCount || result.rowCount === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      res.json({ message: 'Usuário desativado com sucesso.' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cadastro rápido de funcionário (Caixa ou Garçom) via PIN numérico.
   * Não requer e-mail — o login é feito por seleção de nome + PIN.
   * O PIN é armazenado como hash bcrypt no campo password.
   */
  createStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;

      const parsed = staffSchema.safeParse(req.body);
      if (!parsed.success) {
        const msg = parsed.error.errors[0]?.message || 'Dados inválidos.';
        return res.status(400).json({ message: msg });
      }
      const { name, role, pin } = parsed.data;

      // Get role id
      const roleResult = await pool.query('SELECT id, name FROM roles WHERE name = $1', [role]);
      if (!roleResult.rowCount || roleResult.rowCount === 0) {
        return res.status(400).json({ message: 'Cargo inválido.' });
      }
      const targetRoleId = roleResult.rows[0].id;
      const roleName = roleResult.rows[0].name;

      // Check plan limits (same logic as create)
      const companyRes = await pool.query(
        'SELECT plan, extra_cashiers, extra_waiters FROM companies WHERE id = $1',
        [companyId]
      );
      if (!companyRes.rowCount || companyRes.rowCount === 0) {
        return res.status(404).json({ message: 'Empresa não encontrada.' });
      }
      const { plan, extra_cashiers, extra_waiters } = companyRes.rows[0];

      if (plan !== 'pro') {
        const countRes = await pool.query(
          `SELECT COUNT(*) FROM users u
           JOIN roles r ON u.role_id = r.id
           WHERE u.company_id = $1 AND r.name = $2 AND u.active = true`,
          [companyId, roleName]
        );
        const currentCount = parseInt(countRes.rows[0].count, 10);
        const limit = roleName === 'cashier' ? 1 + (extra_cashiers || 0) : 4 + (extra_waiters || 0);

        if (currentCount >= limit) {
          return res.status(400).json({
            message: `Limite de ${roleName === 'cashier' ? 'Caixas' : 'Garçons'} atingido (${currentCount}/${limit}). Adquira mais vagas ou faça upgrade para o plano Pro.`
          });
        }
      }

      // Hash the PIN (stored in the password field)
      const salt = await bcrypt.genSalt(10);
      const hashedPin = await bcrypt.hash(pin, salt);

      // Generate a unique pseudo-email so the DB unique constraint doesn't break
      const pseudoEmail = `staff_${Date.now()}_${Math.random().toString(36).slice(2)}@pin.local`;

      const insertResult = await pool.query(
        `INSERT INTO users (company_id, role_id, name, email, password)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, active`,
        [companyId, targetRoleId, name, pseudoEmail, hashedPin]
      );

      res.status(201).json({ ...insertResult.rows[0], role: roleName, loginMode: 'pin' });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Atualiza o PIN de um funcionário existente.
   */
  updatePin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      const { id } = req.params;
      const { pin } = req.body;

      const pinSchema = z.string().regex(/^\d{3,}$/, 'O PIN deve conter apenas números e no mínimo 3 dígitos.');
      const parsed = pinSchema.safeParse(pin);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPin = await bcrypt.hash(parsed.data, salt);

      const result = await pool.query(
        'UPDATE users SET password = $1, updated_at = now() WHERE id = $2 AND company_id = $3 RETURNING id',
        [hashedPin, id, companyId]
      );

      if (!result.rowCount || result.rowCount === 0) {
        return res.status(404).json({ message: 'Funcionário não encontrado.' });
      }

      res.json({ message: 'PIN atualizado com sucesso.' });
    } catch (error) {
      next(error);
    }
  };
}
