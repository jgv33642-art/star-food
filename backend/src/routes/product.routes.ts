import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';

const router = Router();
const productController = new ProductController();

router.use(authMiddleware);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', productController.getAll);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product data
 */
router.get('/:id', productController.getById);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: string
 *               description:
 *                 type: string
 *               cost:
 *                 type: number
 *               stockQuantity:
 *                 type: number
 *               minimumStock:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/', validateRequest(createProductSchema), productController.create);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: string
 *               description:
 *                 type: string
 *               cost:
 *                 type: number
 *               stockQuantity:
 *                 type: number
 *               minimumStock:
 *                 type: number
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put('/:id', validateRequest(updateProductSchema), productController.update);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete('/:id', productController.delete);

export default router;
