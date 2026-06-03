import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { tenantGuard } from '../middlewares/tenant.guard';

const router = Router();
const orderController = new OrderController();
const paymentController = new PaymentController();

router.use(authMiddleware, tenantGuard);

router.get('/', orderController.getAll);
router.get('/:id', orderController.getById);
router.post('/', orderController.create);
router.post('/:id/items', orderController.addItem);
router.delete('/:id/items/:itemId', orderController.removeItem);
router.put('/:id/close', orderController.close);
router.put('/:id/status', orderController.updateStatus);

// Módulo 3: Checkout Unificado
router.get('/:id/payment-summary', paymentController.summary);
router.post('/:id/pay', paymentController.pay);

export default router;
