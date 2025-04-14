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
router.get('/getTorneo/:id', torneos.obtenerDetallesTorneo);

/**
 * @swagger
 * /torneos/iniciarTorneo:
 *   post:
 *     summary: Iniciar un torneo (solo creador)
 *     tags: [Torneos]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IniciarTorneo'
 *     responses:
 *       200:
 *         description: Torneo iniciado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Torneo'
 *       400:
 *         description: No se puede iniciar el torneo (participantes insuficientes o no es creador)
 *       404:
 *         description: Torneo no encontrado
 */
router.post('/iniciarTorneo', authenticate, torneos.empezarTorneo);

/**
 * @swagger
 * /torneos/FinalizarTorneo:
 *   post:
 *     summary: Finalizar un torneo y declarar ganador (solo creador)
 *     tags: [Torneos]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinalizarTorneo'
 *     responses:
 *       200:
 *         description: Torneo finalizado correctamente
 *       400:
 *         description: Torneo ya tiene ganador o no es creador
 *       404:
 *         description: Torneo no encontrado
 */
router.post('/finalizarTorneo', authenticate, torneos.finalizarTorneo);

/**
 * @swagger
 * /torneos/abandonarTorneo:
 *   post:
 *     summary: Abandonar un torneo
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
 *                 description: ID del torneo al que se quiere abandonar
 *     responses:
 *       200:
 *         description: Usuario abandonó el torneo exitosamente
 */

router.post('/abandonarTorneo', authenticate, torneos.abandonarTorneo);


/**
* @swagger
* /torneos/getTorneosAmigos:
*   get:
*     summary: Obtener torneos de amigos
*     tags: [Torneos]
*     security:
*       - BearerAuth: []
*     responses:
*       200:
*         description: Lista de torneos de amigos
*         content:
*           application/json:
*             schema:
*               type: array
*               items:
*                 type: object
*/
router.get('/getTorneosAmigos', authenticate, torneos.obtenerTorneosDeAmigos);


export default router;
