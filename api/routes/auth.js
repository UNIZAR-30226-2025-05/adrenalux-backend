import * as authCtrl from '../controllers/auth.js';
import { validateRequest } from '../middlewares/validator.js';
import { authenticate } from '../middlewares/auth.js';
import { Router } from 'express';
import { z } from 'zod';

const signUpSchema = {
  body: z.object({
    email: z.string().email({ message: 'with invalid format' }),
    password: z.string().min(6, { message: 'must be at least 6 characters long' }),
    username: z.string().min(3, { message: 'must be at least 3 characters long' }),
    name: z.string().min(1, { message: 'must be at least 1 character long' }),
    lastname: z.string().min(1, { message: 'must be at least 1 character long' })
  })
};

const signInSchema = {
  body: z.object({
    email: z.string().email({ message: 'with invalid format' }),
    password: z.string().min(6, { message: 'must be at least 6 characters long' }),
  })
};

const router = Router();

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
 *             required:
 *               - email
 *               - password
 *               - username
 *               - name
 *               - lastname
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "usuario@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "123456"
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 example: "usuario123"
 *               name:
 *                 type: string
 *                 example: "Juan"
 *               lastname:
 *                 type: string
 *                 example: "Pérez"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: El correo o nombre de usuario ya están en uso
 */
router.post('/sign-up', validateRequest(signUpSchema), authCtrl.signUp);

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
 *             required:
 *               - email
 *               - password
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
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 token: "jwt.token.aquí"
 *       401:
 *         description: Credenciales inválidas
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/sign-in', validateRequest(signInSchema), authCtrl.signIn);

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
 *               data:
 *                 isValid: true
 *                 authMethod: "email"
 *       401:
 *         description: Token inválido, expirado o no proporcionado
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
 */
router.post('/validate-token', authCtrl.validateToken);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Inicia sesión con Google OAuth2
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokenId
 *             properties:
 *               tokenId:
 *                 type: string
 *                 description: ID Token de Google OAuth2
 *                 example: "ya29.a0ARrdaM..."
 *     responses:
 *       200:
 *         description: Usuario autenticado correctamente (nuevo o existente)
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 token: "jwt.token.aquí"
 *                 isNewUser: false
 *       401:
 *         description: Token de Google inválido o expirado
 *         content:
 *           application/json:
 *             example:
 *               error: "Error en autenticación con Google"
 */
router.post('/google', authCtrl.googleSignIn);

export default router;