import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { authMiddleware } from '../middlewares/auth.middleware';
import { pool } from '../config/db';

const router = Router();
const authController = new AuthController();

// TEMPORARY DEV ROUTE TO FIX STUCK ACCOUNTS
router.get('/dev/nuke', async (req, res) => {
  try {
    // Apaga os usuários fantasmas ou da urbs drinks
    await pool.query(`DELETE FROM users WHERE email ILIKE '%@starfood.local%' OR email ILIKE '%urbs%'`);
    // Apaga as empresas urbs drinks
    await pool.query(`DELETE FROM companies WHERE name ILIKE '%urbs%'`);
    res.json({ success: true, message: 'Todas as contas da Urbs Drinks foram apagadas do banco de dados!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Standard email/password login ─────────────────────────────────────────────
router.post('/login', validateRequest(loginSchema), authController.login);

// ── Company registration ──────────────────────────────────────────────────────
router.post('/register', validateRequest(registerSchema), authController.register);

// ── PIN-based login (public — userId comes from the staff list selection) ─────
// Security: the backend always verifies PIN against bcrypt hash in the DB.
// The userId is validated against the company's own users via the DB query.
router.post('/login-pin', authController.loginPin);

// ── List active staff for login screen ────────────────────────────────────────
// 
// SECURITY DESIGN:
//   - Does NOT accept ?companyId= from client (would allow enum of any tenant's staff)
//   - Instead: authenticated users get their own company's staff list
//   - Unauthenticated users (first login) use the public slug-based endpoint below
//
router.get(
  '/staff',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    // Override: use companyId from token only — ignore any query param
    (req as any).query = {}; // strip all query params (security)
    next();
  },
  authController.listStaff
);

// ── PUBLIC: Staff list by company slug (for first-time PIN login screen) ──────
//
// Returns only: id, name, role — never passwords, emails, or UUIDs that matter
// The slug is the human-readable company name (URL-safe), not the UUID.
// This is safe to expose publicly because it reveals no secrets.
//
router.get('/staff/public/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    if (!slug || slug.length < 2) {
      return res.status(400).json({ message: 'Slug inválido.' });
    }

    // Resolve slug to companyId internally — the client never sends the UUID
    const companyRes = await pool.query(
      `SELECT id FROM companies WHERE LOWER(REPLACE(name, ' ', '-')) = LOWER($1) LIMIT 1`,
      [slug]
    );

    if (!companyRes.rows.length) {
      return res.status(404).json({ message: 'Empresa não encontrada.' });
    }

    const companyId = companyRes.rows[0].id;

    // Return only safe fields (no emails, no password hashes)
    const staffRes = await pool.query(
      `SELECT u.id, u.name, r.name as role
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.company_id = $1 AND u.active = true
         AND r.name IN ('cashier', 'waiter')
       ORDER BY u.name ASC`,
      [companyId]
    );

    res.json(staffRes.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
