import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getPartidasPausadas } from '../controllers/partidas.js';  // Importar la función

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Partidas
 *   description: Endpoints relacionados con las partidas
 */

/**
 * @swagger
 * /partidas/pausadas:
 *   get:
 *     summary: Obtener las partidas pausadas de un usuario
 *     tags: [Partidas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de partidas pausadas para el usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pausedMatches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       estado:
 *                         type: string
 *                       user1_id:
 *                         type: integer
 *                       user2_id:
 *                         type: integer
 *                       fecha_creacion:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: No autorizado, falta de token válido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/pausadas', authenticate, getPartidasPausadas); // Usar la función en la ruta

export default router;
