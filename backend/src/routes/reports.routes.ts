import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';
import { tenantGuard } from '../middlewares/tenant.guard';

const router = Router();
const reportsController = new ReportsController();

router.use(authMiddleware, tenantGuard);

// Módulo 7 — Top Produtos
router.get('/top-products', reportsController.topProducts);

// Módulo 5 — CMV
router.get('/cmv',          reportsController.cmv);
router.get('/cmv-summary',  reportsController.cmvSummary);

// Módulo 6 — Alerta de Estoque Mínimo
router.get('/low-stock', reportsController.lowStock);

export default router;
