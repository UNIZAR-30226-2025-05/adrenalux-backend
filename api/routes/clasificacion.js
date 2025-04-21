import express from 'express';
import * as clasificacion from '../controllers/clasificacion.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Clasificacion
 *   description: Endpoints relacionados con el ranking de jugadores
 */

/**
 * @swagger
 * /clasificacion/total:
 *   get:
 *     summary: Obtener la clasificación total de todos los jugadores
 *     tags: [Clasificacion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clasificación general obtenida correctamente
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
 *                       userid:
 *                         type: string
 *                         description: ID del usuario
 *                       username:
 *                         type: string
 *                         description: Nombre de usuario
 *                       name:
 *                         type: string
 *                         description: Nombre real
 *                       lastname:
 *                         type: string
 *                         description: Apellido
 *                       avatar:
 *                         type: string
 *                         description: URL del avatar
 *                       friend_code:
 *                         type: string
 *                         description: Código de amigo
 *                       level:
 *                         type: integer
 *                         description: Nivel del usuario
 *                       experience:
 *                         type: integer
 *                         description: Puntos de experiencia
 *                       clasificacion:
 *                         type: integer
 *                         description: Puntos de clasificación
 *                       estadisticas:
 *                         type: object
 *                         properties:
 *                           partidasJugadas:
 *                             type: integer
 *                             description: Total de partidas jugadas
 *                           partidasGanadas:
 *                             type: integer
 *                             description: Total de partidas ganadas
 *                           partidasPerdidas:
 *                             type: integer
 *                             description: Total de partidas perdidas
 *       401:
 *         description: No autorizado. Token no válido o no proporcionado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/total', authenticate, clasificacion.obtenerClasificacionTotal);

/**
 * @swagger
 * /clasificacion/amigos:
 *   get:
 *     summary: Obtener la clasificación entre amigos del usuario autenticado
 *     tags: [Clasificacion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clasificación de amigos obtenida correctamente
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
 *                       userid:
 *                         type: string
 *                         description: ID del usuario
 *                       username:
 *                         type: string
 *                         description: Nombre de usuario
 *                       name:
 *                         type: string
 *                         description: Nombre real
 *                       lastname:
 *                         type: string
 *                         description: Apellido
 *                       avatar:
 *                         type: string
 *                         description: URL del avatar
 *                       friend_code:
 *                         type: string
 *                         description: Código de amigo
 *                       level:
 *                         type: integer
 *                         description: Nivel del usuario
 *                       experience:
 *                         type: integer
 *                         description: Puntos de experiencia
 *                       clasificacion:
 *                         type: integer
 *                         description: Puntos de clasificación
 *                       estadisticas:
 *                         type: object
 *                         properties:
 *                           partidasJugadas:
 *                             type: integer
 *                             description: Total de partidas jugadas
 *                           partidasGanadas:
 *                             type: integer
 *                             description: Total de partidas ganadas
 *                           partidasPerdidas:
 *                             type: integer
 *                             description: Total de partidas perdidas
 *       401:
 *         description: No autorizado. Token no válido o no proporcionado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/amigos', authenticate, clasificacion.obtenerClasificacionAmigos);

export default router;
