import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import ingredientRoutes from './ingredient.routes';
import publicRoutes from './public.routes';
import devRoutes from './dev.routes';

const router = Router();

router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/dev', devRoutes);

export default router;
