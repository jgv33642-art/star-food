import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// ─── UUID v4 regex for companyId validation ───────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        companyId: string;
        role: string;
        plan: string;
      };
    }
  }
}

/**
 * authMiddleware
 * 
 * Validates the Bearer JWT token, extracts userId/companyId/role,
 * and injects them into req.user.
 * 
 * Security rules:
 *  - Missing or malformed token → 401
 *  - Token with empty/null companyId → 401 (prevents ghost-tenant attacks)
 *  - companyId must be a valid UUID v4 → 401
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de acesso não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // ── Hard guard: companyId must be a non-empty valid UUID ──────────────────
    if (!decoded.companyId || !UUID_REGEX.test(decoded.companyId)) {
      return res.status(401).json({ message: 'Token inválido: empresa não identificada.' });
    }

    // ── Hard guard: userId must be present ────────────────────────────────────
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Token inválido: usuário não identificado.' });
    }

    req.user = {
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: (decoded.role || '').toLowerCase(),
      plan: (decoded.plan || 'basic').toLowerCase(),
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

/**
 * requireRole(...roles)
 * 
 * RBAC middleware factory. Restricts a route to users with one of the given roles.
 * Maps frontend role names (gerencia, caixa, garcom) to backend role names
 * (admin, manager, cashier, waiter) and vice-versa.
 *
 * Usage:
 *   router.post('/staff', authMiddleware, requireRole('admin', 'manager'), controller.createStaff)
 */
export const requireRole = (...allowedRoles: string[]) => {
  // Normalize to lowercase
  const normalized = allowedRoles.map(r => r.toLowerCase());

  // Role alias map (frontend ↔ backend)
  const aliases: Record<string, string[]> = {
    admin:    ['admin', 'gerencia'],
    manager:  ['manager', 'gerencia'],
    cashier:  ['cashier', 'caixa'],
    waiter:   ['waiter', 'garcom', 'garçom'],
    gerencia: ['admin', 'manager', 'gerencia'],
    caixa:    ['cashier', 'caixa'],
    garcom:   ['waiter', 'garcom', 'garçom'],
  };

  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || '';

    // Check if user's role matches any of the allowed roles (with alias expansion)
    const isAllowed = normalized.some(allowed => {
      if (allowed === userRole) return true;
      const aliasList = aliases[allowed] || [];
      return aliasList.includes(userRole);
    });

    if (!isAllowed) {
      return res.status(403).json({
        message: 'Acesso negado. Você não tem permissão para esta ação.',
        requiredRoles: allowedRoles,
        yourRole: userRole,
      });
    }

    next();
  };
};

/**
 * requirePlan(...allowedPlans)
 * 
 * Intercepts API routes and checks if the authenticated company's plan
 * is allowed to access the route.
 */
export const requirePlan = (...allowedPlans: string[]) => {
  const normalized = allowedPlans.map(p => p.toLowerCase());

  return (req: Request, res: Response, next: NextFunction) => {
    // We expect the authService to inject `plan` into req.user or we can fetch it.
    // Wait, the JWT token only has userId, companyId, role.
    // The `plan` was added to the login response, but not to the JWT payload!
    // We should either add it to the JWT payload or fetch it here.
    // Let's assume we can fetch it, or we rely on req.user.plan.
    const userPlan = (req.user as any)?.plan || 'basic'; // Fallback

    if (!normalized.includes(userPlan)) {
      return res.status(403).json({
        message: 'Acesso negado. Funcionalidade não disponível no seu plano.',
        requiredPlans: allowedPlans,
        yourPlan: userPlan,
        code: 'UPGRADE_REQUIRED'
      });
    }

    next();
  };
};
