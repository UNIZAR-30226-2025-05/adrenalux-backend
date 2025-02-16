import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as partidas from '../controllers/partidas.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Partidas
 *   description: Endpoints de partidas
 */

/**
 * @swagger
 * /partidas/matchmaking:
 *   post:
 *     summary: Buscar partida rápida
 *     tags: [Partidas]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Partida encontrada exitosamente
 *       404:
 *         description: No se encontró partida
 */
router.post('/matchmaking', authenticate, partidas.matchmaking);

/**
 * @swagger
 * /partidas/desafiar:
 *   post:
 *     summary: Enviar desafío a un amigo
 *     tags: [Partidas]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *                 description: ID del amigo
 *     responses:
 *       200:
 *         description: Desafío enviado exitosamente
 *       404:
 *         description: Amigo no encontrado
 */
router.post('/desafiar', authenticate, partidas.desafiarAmigo);

/**
 * @swagger
 * /partidas/aceptarDesafio:
 *   post:
 *     summary: Aceptar desafío de un amigo
 *     tags: [Partidas]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               desafioId:
 *                 type: string
 *                 description: ID del desafío
 *     responses:
 *       200:
 *         description: Desafío aceptado exitosamente
 *       404:
 *         description: Desafío no encontrado
 */
router.post('/aceptarDesafio', authenticate, partidas.aceptarDesafio);

/**
 * @swagger
 * /partidas/turno:
 *   post:
 *     summary: Realizar una jugada en el turno actual
 *     tags: [Partidas]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partidaId:
 *                 type: string
 *                 description: ID de la partida
 *               cartaId:
 *                 type: string
 *                 description: ID de la carta seleccionada
 *               estadistica:
 *                 type: string
 *                 enum: [ataque, defensa, control]
 *                 description: Estadística seleccionada
 *     responses:
 *       200:
 *         description: Jugada realizada exitosamente
 *       400:
 *         description: Jugada no válida
 */
router.post('/turno', authenticate, partidas.realizarJugada);

/**
 * @swagger
 * /partidas/abandonar:
 *   post:
 *     summary: Abandonar la partida
 *     tags: [Partidas]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partidaId:
 *                 type: string
 *                 description: ID de la partida
 *     responses:
 *       200:
 *         description: Partida abandonada exitosamente
 *       404:
 *         description: Partida no encontrada
 */
router.post('/abandonar', authenticate, partidas.abandonarPartida);

export default router;
