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
  email: z.string().email().optional(),
  name: z.string().min(1).max(100).optional(),
  lastname: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  clubfavorito: z.string().max(50).optional(),
  escudo: z.string().url().optional(),
  fondo: z.string().url().optional(),
});

const router = Router();

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Obtener el perfil del usuario
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
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
 *       - cookieAuth: []
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

/* Comentadas hasta que se implementen las funciones en el controller
// Experiencia y logros
router.get('/levelxp', authenticate, profile.getLevelxp);
router.get('/experience', authenticate, profile.getExperience);
router.get('/stats', authenticate, profile.getStats);
router.get('/achievements', authenticate, profile.getAchievements);

// Amigos y solicitudes de amistad
router.get('/friends', authenticate, profile.getFriends);
router.get('/friend-requests', authenticate, profile.getFriendRequests);
router.post('/friend-requests', authenticate, profile.sendFriendRequest);

// Monedas y economía
router.get('/adrenacoins', authenticate, profile.getAdrenacoins);
*/

export default router;
