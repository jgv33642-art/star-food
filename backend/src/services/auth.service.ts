import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt';
import { pool } from '../config/db';
import { slugify } from '../utils/slug';

// Schema Zod para validação do PIN
const pinLoginSchema = z.object({
  userId: z.string().uuid('ID de usuário inválido.'),
  pin: z.string().regex(/^\d{3,}$/, 'O PIN deve conter apenas números e no mínimo 3 dígitos.'),
});

export class AuthService {
  private userRepository = new UserRepository();

  async login(data: any) {
    const { companyName, password } = data;

    if (!companyName || !password) {
      throw { status: 400, message: 'Nome do estabelecimento e senha são obrigatórios.' };
    }

    const slug = slugify(companyName);
    const ghostEmail = `${slug}@starfood.local`;

    const user = await this.userRepository.findByEmail(ghostEmail);
    if (!user || !user.active) {
      throw { status: 401, message: 'Estabelecimento não encontrado ou inativo.' };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw { status: 401, message: 'Senha incorreta.' };
    }

    const token = generateToken({
      userId: user.id,
      companyId: user.company_id,
      role: user.role,
      plan: user.company_plan || 'basic',
    });

    // Check if the company has any staff (other than the admin)
    const staffQuery = await pool.query(
      'SELECT count(*) FROM users WHERE company_id = $1 AND id != $2',
      [user.company_id, user.id]
    );
    const hasStaff = parseInt(staffQuery.rows[0].count) > 0;

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        companyName: companyName,
        email: user.email,
        companyId: user.company_id,
        role: user.role,
        plan: user.company_plan || 'basic',
        hasStaff
      },
    };
  }

  async loginPin(data: any) {
    // Validar payload com Zod
    const parsed = pinLoginSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || 'Dados inválidos.';
      throw { status: 400, message: msg };
    }
    const { userId, pin } = parsed.data;

    // Buscar usuário pelo ID (aceita login por PIN apenas para cargos não-admin)
    const res = await pool.query(
      `SELECT u.*, r.name as role, c.plan as company_plan
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.id = $1`,
      [userId]
    );

    const user = res.rows[0];
    if (!user || !user.active) {
      throw { status: 401, message: 'Usuário não encontrado ou inativo.' };
    }

    // O PIN fica armazenado no campo password (hash bcrypt)
    const isValidPin = await bcrypt.compare(pin, user.password);
    if (!isValidPin) {
      throw { status: 401, message: 'PIN incorreto. Tente novamente.' };
    }

    const token = generateToken({
      userId: user.id,
      companyId: user.company_id,
      role: user.role,
      plan: user.company_plan || 'basic',
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyId: user.company_id,
        role: user.role,
        plan: user.company_plan || 'basic',
      },
    };
  }

  async listStaffForLogin(companyId: string) {
    const res = await pool.query(
      `SELECT u.id, u.name, u.active, r.name as role
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.company_id = $1 AND u.active = true
       ORDER BY
         CASE r.name
           WHEN 'admin' THEN 1
           WHEN 'manager' THEN 2
           WHEN 'cashier' THEN 3
           WHEN 'waiter' THEN 4
           ELSE 5
         END,
         u.name ASC`,
      [companyId]
    );
    return res.rows;
  }

  async register(data: any) {
    const { companyName, password, plan } = data;

    if (!companyName || !password) {
      throw { status: 400, message: 'Nome do estabelecimento e senha são obrigatórios.' };
    }

    const slug = slugify(companyName);
    const ghostEmail = `${slug}@starfood.local`;

    const existingUser = await this.userRepository.findByEmail(ghostEmail);
    if (existingUser) {
      throw { status: 400, message: 'Já existe um estabelecimento com este nome.' };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Company
    const newCompany = await this.userRepository.createCompany(companyName, plan || 'start');
    const companyId = newCompany.id;

    // Inserir categorias padrão para o novo estabelecimento
    const defaultCategories = ['Bebidas', 'Drinks', 'Porções', 'Lanches', 'Combos', 'Sobremesas', 'Adicionais'];
    for (const cat of defaultCategories) {
      await pool.query('INSERT INTO categories (name, company_id) VALUES ($1, $2)', [cat, companyId]);
    }

    // Get Admin Role
    const role = await this.userRepository.findRoleByName('admin');
    if (!role) {
      throw { status: 500, message: 'Default roles not configured' };
    }

    // Create Admin User for Company
    const user = await this.userRepository.createUser({
      companyId: companyId,
      roleId: role.id,
      name: companyName, // Use companyName as the user name for the Admin
      email: ghostEmail,
      password: hashedPassword,
    });

    const token = generateToken({
      userId: user.id,
      companyId: company.id,
      role: 'admin',
      plan: company.plan || 'start',
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        companyName: companyName,
        email: user.email,
        companyId: company.id,
        role: 'admin',
        plan: company.plan || 'start',
        hasStaff: false
      },
    };
  }
}
