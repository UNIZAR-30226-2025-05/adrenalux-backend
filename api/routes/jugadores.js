import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as jugadores from '../controllers/jugadores.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Jugadores
 *   description: Endpoints de jugadores
 */

/**
 * @swagger
 * /insertar:
 *   post:
 *     summary: Inserta múltiples cartas en la base de datos
 *     tags: [Jugadores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 alias:
 *                   type: string
 *                 position:
 *                   type: string
 *                 team:
 *                   type: string
 *                 team_shield:
 *                   type: string
 *                 country:
 *                   type: string
 *                 photo:
 *                   type: string
 *                 ratings:
 *                   type: object
 *                   properties:
 *                     ataque:
 *                       type: number
 *                     medio:
 *                       type: number
 *                     defensa:
 *                       type: number
 *     responses:
 *       200:
 *         description: Cartas insertadas exitosamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 */
router.post('/insertar', authenticate, jugadores.insertarCartas);



/**
 * @swagger
 * /generar-luxuryxi:
 *   post:
 *     summary: Genera cartas LuxuryXI
 *     tags: [Jugadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cartas LuxuryXI generadas exitosamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 */
router.post('/jugadores/generar-luxuryxi', authenticate, jugadores.generarCartasLuxuryXI);

/**
 * @swagger
 * /generar-megaluxury:
 *   post:
 *     summary: Genera cartas MegaLuxury
 *     tags: [Jugadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cartas MegaLuxury generadas exitosamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 */
router.post('/jugadores/generar-megaluxury', authenticate, jugadores.generarCartasMegaLuxury);

/**
 * @swagger
 * /generar-luxury:
 *   post:
 *     summary: Genera cartas Luxury
 *     tags: [Jugadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cartas Luxury generadas exitosamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 */
router.post('/generar-luxury', authenticate, jugadores.generarCartasLuxury);


export default router;