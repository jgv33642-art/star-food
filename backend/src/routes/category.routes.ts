import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';
import { tenantGuard } from '../middlewares/tenant.guard';

const router = Router();
const categoryController = new CategoryController();

router.use(authMiddleware, tenantGuard);

router.get('/', categoryController.getAll);
router.post('/', requireRole('admin', 'manager', 'gerencia', 'cashier', 'caixa'), categoryController.create);
router.put('/:id', requireRole('admin', 'manager', 'gerencia', 'cashier', 'caixa'), categoryController.update);
router.delete('/:id', requireRole('admin', 'manager', 'gerencia', 'cashier', 'caixa'), categoryController.delete);

export default router;
