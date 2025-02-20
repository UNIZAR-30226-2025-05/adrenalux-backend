import { validateRequest } from '../middlewares/validator.js';
import { authenticate } from '../middlewares/auth.js';
import { Router } from 'express';
import { z } from 'zod';
import * as profile from '../controllers/profile.js';

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Endpoints de perfil de usuario
 */

const profileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  lastname: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  escudo: z.string().url().optional(),
});

const router = Router();

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Obtener el perfil del usuario
 *     tags: [Profile]
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
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     friendCode:
 *                       type: string
 *                     photo:
 *                       type: string
 *                     adrenacoins:
 *                       type: integer
 *                     xp:
 *                       type: integer
 *                     levelxp:
 *                       type: integer
 *                     puntos:
 *                       type: integer
 *                     logros:
 *                       type: array
 *                       items:
 *                         type: string
 *                     partidas:
 *                       type: integer
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/profile', authenticate, profile.getProfile);

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Actualizar el perfil del usuario
 *     tags: [Profile]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               lastname:
 *                 type: string
 *               avatar:
 *                 type: string
 *               clubfavorito:
 *                 type: string
 *               escudo:
 *                 type: string
 *               fondo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *       400:
 *         description: No se enviaron cambios válidos
 */
router.put('/profile', authenticate, validateRequest(profileSchema), profile.updateProfile);

/**
 * @swagger
 * /profile/levelxp:
 *   get:
 *     summary: Obtener el nivel y la experiencia del usuario
 *     tags: [Profile]
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
 *         description: Nivel y experiencia obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     level:
 *                       type: integer
 *                     experience:
 *                       type: integer
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/profile/levelxp', authenticate, profile.getLevelxp);

/**
 * @swagger
 * /profile/clasificacion:
 *   get:
 *     summary: Obtener los puntos de clasificación del usuario
 *     tags: [Profile]
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
 *         description: Puntos de clasificación obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     puntosClasificacion:
 *                       type: integer
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/profile/clasificacion', authenticate, profile.getClasificacion);

/**
 * @swagger
 * /profile/adrenacoins:
 *   get:
 *     summary: Obtener los adrenacoins del usuario
 *     tags: [Profile]
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
 *         description: Adrenacoins obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     adrenacoins:
 *                       type: integer
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/profile/adrenacoins', authenticate, profile.getAdrenacoins);

/**
 * @swagger
 * /profile/friends:
 *   get:
 *     summary: Obtener la lista de amigos del usuario
 *     tags: [Profile]
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
 *         description: Lista de amigos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       name:
 *                         type: string
 *                       lastname:
 *                         type: string
 *                       avatar:
 *                         type: string
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/profile/friends', authenticate, profile.getFriends);

/**
 * @swagger
 * /profile/friend-requests:
 *   get:
 *     summary: Obtener las solicitudes de amistad pendientes
 *     tags: [Profile]
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
 *         description: Solicitudes de amistad obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       name:
 *                         type: string
 *                       lastname:
 *                         type: string
 *                       avatar:
 *                         type: string
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/profile/friend-requests', authenticate, profile.getFriendRequests);

/**
 * @swagger
 * /profile/friend-requests:
 *   post:
 *     summary: Enviar una solicitud de amistad
 *     tags: [Profile]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: integer
 *                 description: ID del usuario al que se envía la solicitud
 *     responses:
 *       200:
 *         description: Solicitud de amistad enviada correctamente
 *       400:
 *         description: Datos inválidos o el usuario ya es tu amigo
 */
router.post('/profile/friend-requests', authenticate, profile.sendFriendRequest);

/**
 * @swagger
 * /profile/achievements:
 *   get:
 *     summary: Obtener los logros del usuario
 *     tags: [Profile]
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
 *         description: Logros obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       descripcion:
 *                         type: string
 *                       fechaObtencion:
 *                         type: string
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/profile/achievements', authenticate, profile.getAchievements);

/**
 * @swagger
 * /profile/change-password:
 *   put:
 *     summary: Cambiar la contraseña del usuario
 *     tags: [Profile]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: Contraseña actual
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña
 *     responses:
 *       200:
 *         description: Contraseña cambiada correctamente
 *       400:
 *         description: Contraseña actual incorrecta o datos inválidos
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/profile/change-password', authenticate, profile.updatePassword);

/**
 * @swagger
 * /profile:
 *   delete:
 *     summary: Eliminar la cuenta del usuario
 *     tags: [Profile]
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
 *         description: Cuenta eliminada correctamente
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/profile', authenticate, profile.deleteUser);

// Comentadas hasta que se implementen las funciones en el controller
/*
router.get('/profile/stats', authenticate, profile.getStats);
router.put('/profile/settings', authenticate, profile.updateUserSettings);
*/

export default router;