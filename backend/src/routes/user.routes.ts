import { Router } from 'express';
import { authMiddleware, requireRole, requirePlan } from '../middlewares/auth.middleware';
import { tenantGuard } from '../middlewares/tenant.guard';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

// All user routes require authentication + tenant isolation
router.use(authMiddleware, tenantGuard);

// ── List all users (gerencia + caixa can view) ─────────────────────────────────
router.get('/', userController.list);

// ── Full user creation (requires manager) ─────────────────────────────────────
router.post('/', requirePlan('basic', 'pro'), requireRole('admin', 'manager', 'gerencia'), userController.create);

// ── Quick staff creation via PIN (requires manager) ───────────────────────────
router.post('/staff', requirePlan('basic', 'pro'), requireRole('admin', 'manager', 'gerencia'), userController.createStaff);

// ── Update PIN (requires manager) ─────────────────────────────────────────────
router.put('/:id/pin', requirePlan('basic', 'pro'), requireRole('admin', 'manager', 'gerencia'), userController.updatePin);

// ── General update (requires manager) ─────────────────────────────────────────
router.put('/:id', requirePlan('basic', 'pro'), requireRole('admin', 'manager', 'gerencia'), userController.update);

// ── Soft delete (requires manager) ────────────────────────────────────────────
router.delete('/:id', requirePlan('basic', 'pro'), requireRole('admin', 'manager', 'gerencia'), userController.delete);

export default router;
