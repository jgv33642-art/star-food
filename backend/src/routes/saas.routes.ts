import { Router } from 'express';
import { SaasController } from '../controllers/saas.controller';

const router = Router();
const saasController = new SaasController();

// Basic security middleware for the SaaS routes
// For MVP, checking an admin secret or just being open if not strictly defined.
// In production, this should be a JWT token check for a "superadmin" user role.
const superAdminGuard = (req: any, res: any, next: any) => {
  const secret = req.headers['x-saas-secret'];
  if (secret === '336421') {
    return next();
  }
  return res.status(403).json({ message: 'Acesso negado ao painel SaaS.' });
};

router.use(superAdminGuard);

router.get('/tenants', saasController.listTenants);
router.get('/tenants/:id/users', saasController.listTenantUsers);
router.post('/tenants/:id/users', saasController.createTenantUser);

export default router;
