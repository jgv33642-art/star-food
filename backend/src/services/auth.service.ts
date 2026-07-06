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
    const { email, password } = data;

    if (!email || !password) {
      throw { status: 400, message: 'E-mail e senha são obrigatórios.' };
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.active) {
      throw { status: 401, message: 'Usuário não encontrado ou inativo.' };
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
        companyName: user.company_name,
        email: user.email,
        companyId: user.company_id,
        role: user.role,
        plan: user.company_plan || 'basic',
        companyActive: user.company_active,
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
      `SELECT u.*, r.name as role, c.plan as company_plan, c.name as company_name, c.active as company_active
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
    if (!user.company_active) {
      throw { status: 401, message: 'Estabelecimento inativo ou pagamento pendente.' };
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
        companyName: user.company_name,
        companyId: user.company_id,
        role: user.role,
        plan: user.company_plan || 'basic',
        companyActive: user.company_active,
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

    if (!companyName || !password || !userName || !email) {
      throw { status: 400, message: 'Todos os campos são obrigatórios.' };
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw { status: 400, message: 'Este e-mail já está cadastrado no sistema.' };
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
      name: userName, // Use the provided user name
      email: email, // Use the provided email
      password: hashedPassword,
    });

    const token = generateToken({
      userId: user.id,
      companyId: newCompany.id,
      role: 'admin',
      plan: newCompany.plan || 'start',
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        companyName: companyName,
        email: user.email,
        companyId: newCompany.id,
        role: 'admin',
        plan: newCompany.plan || 'start',
        companyActive: false,
        hasStaff: false
      },
    };
  }
}
