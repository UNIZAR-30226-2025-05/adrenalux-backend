import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as torneos from '../controllers/torneo.js';
import { validateRequest } from '../middlewares/validator.js';
import { z } from 'zod';

const router = express.Router();

const Torneoschema = z.object({
  nombre: z.string().min(3).max(50),
  contrasena: z.string().min(1).max(100).optional(),
  premio: z.string().min(1).max(100),
  descripcion: z.string().min(1).max(250),
});

/**
 * @swagger
 * tags:
 *   name: Torneos
 *   description: API para la gestión de torneos
 */

/**
 * @swagger
 * /torneos/crear:
 *   post:
 *     summary: Crear un nuevo torneo
 *     tags: [Torneos]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               fechaInicio:
 *                 type: string
 *                 format: date
 *               maxParticipantes:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Torneo creado exitosamente
 */
router.post('/crear', authenticate, validateRequest(Torneoschema), torneos.crearTorneo);

/**
 * @swagger
 * /torneos/unirse:
 *   post:
 *     summary: Unirse a un torneo
 *     tags: [Torneos]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID del torneo al que se quiere unir
 *     responses:
 *       200:
 *         description: Usuario unido al torneo exitosamente
 *       400:
 *         description: Error en la solicitud
 */
router.post('/unirse', authenticate, torneos.unirseTorneo);

/**
 * @swagger
 * /torneos/getTorneosActivos:
 *   get:
 *     summary: Obtener torneos activos
 *     tags: [Torneos]
 *     responses:
 *       200:
 *         description: Lista de torneos activos
 */
router.get('/getTorneosActivos', torneos.obtenerTorneosActivos);

/**
 * @swagger
 * /torneos/getTorneosJugador:
 *   get:
 *     summary: Obtener torneos jugados por un jugador
 *     tags: [Torneos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jugadorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del jugador
 *     responses:
 *       200:
 *         description: Lista de torneos en los que ha participado el jugador
 */
router.get('/getTorneosJugador', authenticate, torneos.obtenerTorneosJugados);

/**
 * @swagger
 * /torneos/getTorneo:
 *   get:
 *     summary: Obtener detalles de un torneo
 *     tags: [Torneos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID del torneo del cual obtener la información
 *     responses:
 *       200:
 *         description: Detalles del torneo
 */
router.get('/getTorneo:id', torneos.obtenerDetallesTorneo);

export default router;
