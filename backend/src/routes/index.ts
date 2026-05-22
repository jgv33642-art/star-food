import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import ingredientRoutes from './ingredient.routes';
import publicRoutes from './public.routes';
import devRoutes from './dev.routes';
import categoryRoutes from './category.routes';
import tableRoutes from './table.routes';
import orderRoutes from './order.routes';
import saleRoutes from './sale.routes';
import cashierRoutes from './cashier.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/dev', devRoutes);
router.use('/categories', categoryRoutes);
router.use('/tables', tableRoutes);
router.use('/orders', orderRoutes);
router.use('/sales', saleRoutes);
router.use('/cashier', cashierRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
