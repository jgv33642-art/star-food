import { Router } from 'express';
import { PublicController } from '../controllers/public.controller';

const router = Router();
const publicController = new PublicController();

router.get('/menu/:companyId', publicController.getMenu);
router.post('/order/:companyId', publicController.createOrder);

export default router;
