import { Router } from 'express';
import { CashierController } from '../controllers/cashier.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';
import { tenantGuard } from '../middlewares/tenant.guard';

const router = Router();
const cashierController = new CashierController();

router.use(authMiddleware, tenantGuard);

router.get('/current', cashierController.getCurrent);
router.post('/open',  requireRole('admin', 'manager', 'gerencia', 'cashier', 'caixa'), cashierController.open);
router.post('/close', requireRole('admin', 'manager', 'gerencia', 'cashier', 'caixa'), cashierController.close);

export default router;
