import { Router } from 'express';
import { SaleController } from '../controllers/sale.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const saleController = new SaleController();

router.use(authMiddleware);

router.get('/', saleController.getAll);
router.get('/:id', saleController.getById);
router.post('/', saleController.create);

export default router;
