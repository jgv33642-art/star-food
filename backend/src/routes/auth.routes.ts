import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to the system
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', validateRequest(loginSchema), authController.login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new company and admin user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - userName
 *               - email
 *               - password
 *             properties:
 *               companyName:
 *                 type: string
 *               userName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Company and user created successfully
 */
router.post('/register', validateRequest(registerSchema), authController.register);

export default router;
