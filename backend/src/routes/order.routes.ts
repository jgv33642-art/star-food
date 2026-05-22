import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const orderController = new OrderController();

router.use(authMiddleware);

router.get('/', orderController.getAll);
router.get('/:id', orderController.getById);
router.post('/', orderController.create);
router.post('/:id/items', orderController.addItem);
router.delete('/:id/items/:itemId', orderController.removeItem);
router.put('/:id/close', orderController.close);

export default router;
