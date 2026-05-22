import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

router.use(authMiddleware);

router.get('/stats', dashboardController.getStats);

export default router;
