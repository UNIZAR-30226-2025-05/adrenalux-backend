import express from 'express';
import * as clasificacion from '../controllers/clasificacion.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Clasificacion
 *   description: Rutas para gestionar la clasificación
 */

/**
 * @swagger
 * /clasificacion/total:
 *   get:
 *     summary: Obtener la clasificación total
 *     tags: [Clasificacion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clasificación total obtenida exitosamente
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
 *                       # Aquí se devuelve toda la información del usuario
 *                       id:
 *                         type: integer
 *                         description: ID del usuario
 *                       nombre:
 *                         type: string
 *                         description: Nombre del usuario
 *                       email:
 *                         type: string
 *                         description: Email del usuario
 *                       puntosClasificacion:
 *                         type: integer
 *                         description: Puntos de clasificación del usuario
 *                       # Aquí se añaden las estadísticas de partidas
 *                       partidasJugadas:
 *                         type: integer
 *                         description: Número de partidas jugadas por el usuario
 *                       partidasGanadas:
 *                         type: integer
 *                         description: Número de partidas ganadas por el usuario
 *                       partidasPerdidas:
 *                         type: integer
 *                         description: Número de partidas perdidas por el usuario
 *                      
 *       401:
 *         description: No autorizado para ver la clasificación
 */
router.get('/total', authenticate, clasificacion.obtenerClasificacionTotal);

/**
 * @swagger
 * /clasificacion/amigos:
 *   get:
 *     summary: Obtener la clasificación solo con amigos
 *     tags: [Clasificacion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clasificación con amigos obtenida exitosamente
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
 *                       # Aquí se devuelve toda la información del usuario
 *                       id:
 *                         type: integer
 *                         description: ID del usuario
 *                       nombre:
 *                         type: string
 *                         description: Nombre del usuario
 *                       email:
 *                         type: string
 *                         description: Email del usuario
 *                       puntosClasificacion:
 *                         type: integer
 *                         description: Puntos de clasificación del usuario
 *                       # Aquí se añaden las estadísticas de partidas
 *                       partidasJugadas:
 *                         type: integer
 *                         description: Número de partidas jugadas por el usuario
 *                       partidasGanadas:
 *                         type: integer
 *                         description: Número de partidas ganadas por el usuario
 *                       partidasPerdidas:
 *                         type: integer
 *                         description: Número de partidas perdidas por el usuario
 *       401:
 *         description: No autorizado para ver la clasificación
 */
router.get('/amigos', authenticate, clasificacion.obtenerClasificacionAmigos);

export default router;