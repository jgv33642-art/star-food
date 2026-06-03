import { Router } from 'express';
import { StockController } from '../controllers/stock.controller';
import { authMiddleware, requireRole, requirePlan } from '../middlewares/auth.middleware';
import { tenantGuard } from '../middlewares/tenant.guard';

const router = Router();
const stockController = new StockController();

router.use(authMiddleware, tenantGuard, requirePlan('basic', 'pro'));

// Stock import requires at least manager/cashier level
router.post('/import-xml',    requireRole('admin', 'manager', 'gerencia', 'cashier', 'caixa'), stockController.importXml);
router.post('/import-qrcode', requireRole('admin', 'manager', 'gerencia', 'cashier', 'caixa'), stockController.importQrCode);
router.post('/confirm-import',requireRole('admin', 'manager', 'gerencia', 'cashier', 'caixa'), stockController.confirmImport);
router.get('/history',        stockController.getHistory);

export default router;
