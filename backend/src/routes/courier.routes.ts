import { Router } from 'express';
import { createCourier, getCouriers, updateCourier, deleteCourier } from '../controllers/courier.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createCourier);
router.get('/', getCouriers);
router.put('/:id', updateCourier);
router.delete('/:id', deleteCourier);

export default router;
