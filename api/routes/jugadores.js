import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validator.js';
import { transformarJugador } from '../controllers/jugadores.js'; // Asegúrate de que el controlador esté definido

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Jugadores
 *   description: Endpoints de jugadores
 */

/**
 * @swagger
 * /transformar:
 *   post:
 *     summary: Transforma un jugador
 *     tags: [Jugadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Jugador transformado exitosamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 */
router.post('/transformar', authenticate, validateRequest, transformarJugador);

export default router;