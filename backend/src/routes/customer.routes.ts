import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const customerController = new CustomerController();

router.use(authMiddleware);

router.get('/', customerController.getAll);

export default router;
