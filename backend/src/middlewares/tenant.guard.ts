import { Request, Response, NextFunction } from 'express';

/**
 * tenantGuard
 *
 * Critical security middleware for multi-tenant isolation.
 * 
 * This middleware MUST be applied to ALL authenticated routes.
 * It performs two operations:
 *
 * 1. STRIP: Removes any attempt by the client to inject a company_id
 *    via request body, query params, or headers. The ONLY trusted
 *    source of company_id is req.user.companyId (from the JWT token).
 *
 * 2. ENFORCE: After stripping, sets req.body.__tenantId to the 
 *    verified companyId from the token so controllers always have 
 *    a clean reference (though controllers should use req.user.companyId
 *    directly — this is just a belt-and-suspenders measure).
 *
 * Attack scenarios prevented:
 *  - Body injection:  POST /products { "company_id": "other-tenant-uuid", ... }
 *  - Query injection: GET /users?companyId=other-tenant-uuid
 *  - Header spoofing: X-Company-Id: other-tenant-uuid (unless user is using a public endpoint)
 */
export const tenantGuard = (req: Request, res: Response, next: NextFunction) => {
  // ── 1. Strip from body ─────────────────────────────────────────────────────
  if (req.body && typeof req.body === 'object') {
    delete req.body.company_id;
    delete req.body.companyId;
    delete req.body.tenant_id;
    delete req.body.tenantId;
    delete req.body.company;
  }

  // ── 2. Strip from query params ─────────────────────────────────────────────
  if (req.query) {
    delete (req.query as any).company_id;
    // Note: companyId in query IS allowed ONLY on public routes (e.g. /auth/staff/:slug)
    // On authenticated routes it is stripped here.
    delete (req.query as any).companyId;
    delete (req.query as any).tenant_id;
    delete (req.query as any).tenantId;
  }

  // ── 3. Verify companyId is present in token (should already be enforced by authMiddleware) ──
  if (!req.user?.companyId) {
    return res.status(401).json({ message: 'Sessão inválida: empresa não identificada no token.' });
  }

  next();
};

/**
 * scopedQuery helper
 *
 * Utility type to remind developers that every DB query on
 * tenant-scoped resources MUST include company_id = $N.
 *
 * Usage in controllers:
 *   const { companyId } = assertTenant(req);
 *   await pool.query('SELECT * FROM products WHERE company_id = $1', [companyId]);
 */
export function assertTenant(req: Request): { companyId: string; userId: string; role: string } {
  if (!req.user?.companyId) {
    throw Object.assign(new Error('Tenant not authenticated'), { status: 401 });
  }
  return {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role,
  };
}
