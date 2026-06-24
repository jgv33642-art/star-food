import { Router } from 'express';
import { ComplementController } from '../controllers/complement.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const complementController = new ComplementController();

router.use(authMiddleware);

// Ler complementos (todos podem)
router.get('/', complementController.getCategories);
router.get('/product/:productId', complementController.getProductComplements);

// Modificar complementos (somente admins/gerentes)
router.post('/', requireRole(['admin', 'manager']), complementController.createCategory);
router.put('/:id', requireRole(['admin', 'manager']), complementController.updateCategory);
router.delete('/:id', requireRole(['admin', 'manager']), complementController.deleteCategory);

router.post('/:categoryId/options', requireRole(['admin', 'manager']), complementController.createOption);
router.put('/options/:optionId', requireRole(['admin', 'manager']), complementController.updateOption);
router.delete('/options/:optionId', requireRole(['admin', 'manager']), complementController.deleteOption);

// Vínculos
router.post('/product/:productId/link', requireRole(['admin', 'manager']), complementController.linkToProduct);
router.delete('/product/:productId/link/:categoryId', requireRole(['admin', 'manager']), complementController.unlinkFromProduct);

export default router;
