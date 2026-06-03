import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';
import { tenantGuard } from '../middlewares/tenant.guard';

const router = Router();
const companyController = new CompanyController();

router.use(authMiddleware, tenantGuard);

router.get('/my', companyController.getMyCompany);
router.post('/upgrade',        requireRole('admin', 'manager', 'gerencia'), companyController.upgradePlan);
router.post('/purchase-seats', requireRole('admin', 'manager', 'gerencia'), companyController.purchaseSeats);

export default router;
