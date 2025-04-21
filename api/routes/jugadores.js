import express from 'express';
import { apiKeyAuth } from '../middlewares/auth.js';
import * as jugadores from '../controllers/jugadores.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Jugadores
 *   description: Endpoints relacionados con cartas de jugadores
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *   schemas:
 *     Rating:
 *       type: object
 *       properties:
 *         ataque:
 *           type: number
 *         medio:
 *           type: number
 *         defensa:
 *           type: number
 *     Jugador:
 *       type: object
 *       required:
 *         - name
 *         - position
 *         - team
 *         - country
 *         - photo
 *         - ratings
 *       properties:
 *         name:
 *           type: string
 *         alias:
 *           type: string
 *         position:
 *           type: string
 *         team:
 *           type: string
 *         team_shield:
 *           type: string
 *         country:
 *           type: string
 *         photo:
 *           type: string
 *         ratings:
 *           $ref: '#/components/schemas/Rating'
 */

/**
 * @swagger
 * /insertar:
 *   post:
 *     summary: Inserta múltiples cartas de jugadores
 *     tags: [Jugadores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Lista de jugadores para insertar
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Jugador'
 *     responses:
 *       201:
 *         description: Cartas insertadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inserted:
 *                   type: number
 *                 failed:
 *                   type: number
 *       400:
 *         description: Solicitud inválida
 *       401:
 *         description: No autorizado
 */
router.post('/insertar', apiKeyAuth, jugadores.insertarCartas);

/**
 * @swagger
 * /generar-luxuryxi:
 *   post:
 *     summary: Genera cartas LuxuryXI (los mejores 11)
 *     tags: [Jugadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cartas LuxuryXI generadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: number
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/generar-luxuryxi', apiKeyAuth, jugadores.generarCartasLuxuryXI);

/**
 * @swagger
 * /generar-megaluxury:
 *   post:
 *     summary: Genera cartas MegaLuxury (jugadores élite sin repetir)
 *     tags: [Jugadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cartas MegaLuxury generadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: number
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/generar-megaluxury', apiKeyAuth, jugadores.generarCartasMegaLuxury);

/**
 * @swagger
 * /generar-luxury:
 *   post:
 *     summary: Genera cartas Luxury (jugadores top sin repetir)
 *     tags: [Jugadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cartas Luxury generadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: number
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/generar-luxury', apiKeyAuth, jugadores.generarCartasLuxury);

export default router;
