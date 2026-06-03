import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt';
import { pool } from '../config/db';

// Schema Zod para validação do PIN
const pinLoginSchema = z.object({
  userId: z.string().uuid('ID de usuário inválido.'),
  pin: z.string().regex(/^\d{3,}$/, 'O PIN deve conter apenas números e no mínimo 3 dígitos.'),
});

export class AuthService {
  private userRepository = new UserRepository();

  async login(data: any) {
    const { email, password } = data;

    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.active) {
      throw { status: 401, message: 'Invalid credentials or inactive user' };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw { status: 401, message: 'Invalid credentials' };
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
    const { companyName, userName, email, password, plan } = data;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw { status: 400, message: 'Email already exists' };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Company
    const company = await this.userRepository.createCompany(companyName, plan || 'start');

    // Get Admin Role
    const role = await this.userRepository.findRoleByName('admin');
    if (!role) {
      throw { status: 500, message: 'Default roles not configured' };
    }

    // Create Admin User for Company
    const user = await this.userRepository.createUser({
      companyId: company.id,
      roleId: role.id,
      name: userName,
      email,
      password: hashedPassword,
    });

    const token = generateToken({
      userId: user.id,
      companyId: company.id,
      role: 'admin',
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyId: company.id,
        role: 'admin',
      },
    };
  }
}
