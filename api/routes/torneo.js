const express = require('express');
import { authenticate } from '../middlewares/auth.js';
import * as torneos from '../controllers/torneos.js';
import { validateRequest } from '../middlewares/validator.js';
import { z } from 'zod';
const router = express.Router();

const Torneoschema = z.object({
  nombre: z.string().min(3).max(50)(),
  contrasena: z.string().min(1).max(100).optional(),
  premio: z.string().min(1).max(100)(),
  descripcion: z.string().url()(),

});

/**
 * @swagger
 * tags:
 *   name: Torneos
 *   description: API para la gestión de torneos
 */

/**
 * @swagger
 * /torneos:
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
 */
router.post('/crear', authenticate, validateRequest(Torneoschema), torneos.crearTorneo);

/**
 * @swagger
 * /unirse:
 *   post:
 *     summary: Unirse a un torneo
 *     tags: [Torneos]
 *     security:
 *       - BearerAuth: []
 *    requestBody:
 *      required: id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del torneo
 */
router.post('/unirse', authenticate, torneos.unirseTorneo);

/**
 * @swagger
 * /getTorneosActivos:
 *   get:
 *     summary: Obtener torneos activos
 *     tags: [Torneos]
 */
router.get('/getTorneosActivos', torneos.obtenerTorneosActivos);

/**
 * @swagger
 * /getTorneosJugador:
 *   get:
 *     summary: Obtener torneos jugados por un jugador
 *     tags: [Torneos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jugadorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del jugador
 */
router.get('/getTorneosJugador', authenticate, torneos.obtenerTorneosJugados);

/**
 * @swagger
 * /getTorneo:
 *   get:
 *     summary: Obtener detalles de un torneo
 *     tags: [Torneos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del torneo
 */
router.get('/getTorneo', torneos.obtenerDetallesTorneo);

export default router;