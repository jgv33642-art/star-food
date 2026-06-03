import { Router } from 'express';
import { TableController } from '../controllers/table.controller';
import { authMiddleware, requirePlan } from '../middlewares/auth.middleware';

const router = Router();
const tableController = new TableController();

router.use(authMiddleware, requirePlan('basic', 'pro'));

router.get('/', tableController.getAll);
router.get('/:id', tableController.getById);
router.post('/', tableController.create);
router.put('/:id', tableController.update);
router.delete('/:id', tableController.delete);

export default router;
