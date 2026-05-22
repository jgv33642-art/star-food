import { Router } from 'express';
import { CashierController } from '../controllers/cashier.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const cashierController = new CashierController();

router.use(authMiddleware);

router.get('/current', cashierController.getCurrent);
router.post('/open', cashierController.open);
router.post('/close', cashierController.close);

export default router;
