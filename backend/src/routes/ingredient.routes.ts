import { Router } from 'express';
import { IngredientController } from '../controllers/ingredient.controller';
import { authMiddleware, requirePlan } from '../middlewares/auth.middleware';

const router = Router();
const ingredientController = new IngredientController();

router.use(authMiddleware, requirePlan('basic', 'pro'));

router.get('/', ingredientController.getAll);
router.get('/:id', ingredientController.getById);
router.post('/', ingredientController.create);
router.put('/:id', ingredientController.update);
router.delete('/:id', ingredientController.delete);

// Rotas para gerenciar ingredientes de um produto
router.get('/product/:productId', ingredientController.getProductIngredients);
router.post('/product/:productId', ingredientController.addProductIngredient);
router.delete('/product-ingredient/:id', ingredientController.removeProductIngredient);

export default router;
