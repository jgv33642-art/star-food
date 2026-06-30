import { Router } from 'express';
import { PublicController } from '../controllers/public.controller';

const router = Router();
const publicController = new PublicController();

router.get('/table/:tableId', publicController.getTable);
router.get('/menu/:companyId', publicController.getMenu);
router.post('/order/:companyId', publicController.createOrder);
router.post('/coupon/:companyId', publicController.validateCoupon);
router.get('/order-status/:companyId/:trackingCode', publicController.getOrderStatus);

export default router;
