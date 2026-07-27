import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authMiddleware, requireRole, requirePlan } from '../middlewares/auth.middleware';
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

// Módulo 8 e 9 — Inteligência (Premium)
router.get('/heatmap', requirePlan('premium', 'annual'), reportsController.heatmap);
router.get('/affinity', requirePlan('premium', 'annual'), reportsController.affinity);

export default router;
