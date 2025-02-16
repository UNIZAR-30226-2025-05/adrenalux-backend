import * as authCtrl from '../controllers/auth.js';
import { validateRequest } from '../middlewares/validator.js';
import { authenticate } from '../middlewares/auth.js';
import { Router } from 'express';
import { z } from 'zod';

const authSchema = {
  body: z.object({
    email: z.string().email({ message: 'with invalid format' }),
    password: z.string().min(6, { message: 'must be at least 6 characters long' })
  })
};

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación
 */

/**
 * @swagger
 * /auth/sign-up:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "usuario@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error en la validación de datos
 */
router.post('/sign-up', validateRequest(authSchema), authCtrl.signUp);

/**
 * @swagger
 * /auth/sign-in:
 *   post:
 *     summary: Inicia sesión en la aplicación
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "usuario@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Usuario autenticado correctamente
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/sign-in', validateRequest(authSchema), authCtrl.signIn);

/**
 * @swagger
 * /auth/sign-out:
 *   post:
 *     summary: Cierra la sesión del usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 *       401:
 *         description: No autenticado
 */
router.post('/sign-out', authenticate, authCtrl.signOut);

/**
 * @swagger
 * /auth/validate-token:
 *   get:
 *     summary: Valida la autenticidad del token JWT
 *     tags: [Auth]
 *     description: Verifica si el token de autenticación es válido y está activo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *           example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         description: Token JWT obtenido al iniciar sesión
 *     responses:
 *       200:
 *         description: Token válido y activo
 *         content:
 *           application/json:
 *             example:
 *               isValid: true
 *       401:
 *         description: |
 *           Error de autenticación. Posibles causas:
 *           - Token expirado
 *           - Formato de token inválido
 *           - Token no proporcionado
 *         content:
 *           application/json:
 *             examples:
 *               expired:
 *                 value: { error: "Token expirado" }
 *               invalid:
 *                 value: { error: "Token inválido" }
 *       404:
 *         description: Usuario asociado al token no encontrado
 *         content:
 *           application/json:
 *             example:
 *               error: "Usuario no existe"
 *       500:
 *         description: Error interno del servidor
 * 
 */
router.get('/validate-token', authCtrl.validateToken);

export default router;
