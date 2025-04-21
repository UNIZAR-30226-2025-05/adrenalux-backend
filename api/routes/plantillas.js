import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as plantilla from '../controllers/plantillas.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Plantillas
 *   description: Rutas para gestionar plantillas
 */

/**
 * @swagger
 * /plantillas:
 *   post:
 *     summary: Crear una nueva plantilla
 *     tags: [Plantillas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre de la plantilla
 *     responses:
 *       201:
 *         description: Plantilla creada exitosamente
 *       400:
 *         description: Nombre de plantilla inválido
 */
router.post('/', authenticate, plantilla.crearPlantilla);

/**
 * @swagger
 * /plantillas:
 *   get:
 *     summary: Obtener todas las plantillas del usuario autenticado
 *     tags: [Plantillas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de plantillas del usuario
 */
router.get('/', authenticate, plantilla.obtenerPlantillas);

/**
 * @swagger
 * /plantillas/{plantillaId}:
 *   put:
 *     summary: Actualizar el nombre de una plantilla
 *     tags: [Plantillas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: plantillaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la plantilla
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nuevoNombre:
 *                 type: string
 *                 description: Nuevo nombre de la plantilla
 *     responses:
 *       200:
 *         description: Plantilla actualizada exitosamente
 *       400:
 *         description: Nombre de plantilla inválido
 *       401:
 *         description: No autorizado para modificar esta plantilla
 */
router.put('/', authenticate, plantilla.actualizarPlantilla);

/**
 * @swagger
 * /plantillas/{plantillaId}:
 *   delete:
 *     summary: Eliminar una plantilla
 *     tags: [Plantillas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: plantillaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la plantilla
 *     responses:
 *       200:
 *         description: Plantilla eliminada exitosamente
 *       401:
 *         description: No autorizado para eliminar esta plantilla
 */
router.delete('/', authenticate, plantilla.eliminarPlantilla);

/**
 * @swagger
 * /agregarCartasPlantilla:
 *   post:
 *     summary: Agregar una carta a una plantilla
 *     tags: [Plantillas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plantillaId:
 *                 type: integer
 *                 description: ID de la plantilla
 *               cartasid:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs de las cartas
 *               posiciones:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Posiciones de las cartas en la plantilla
 *     responses:
 *       200:
 *         description: Cartas agregadas exitosamente
 *       400:
 *         description: Posición inválida o carta no encontrada
 *       401:
 *         description: No autorizado para modificar esta plantilla
 */
router.post('/agregarCartasPlantilla', authenticate, plantilla.agregarCartasPlantilla);

/**
 * @swagger
 * /getCartasPorPlantilla/{plantillaId}:
 *   get:
 *     summary: Obtener todas las cartas de una plantilla
 *     tags: [Plantillas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: plantillaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la plantilla
 *     responses:
 *       200:
 *         description: Lista de cartas de la plantilla
 *       401:
 *         description: No autorizado para ver esta plantilla
 *       404:
 *         description: No se encontraron cartas asociadas a esta plantilla
 */
router.get('/getCartasporPlantilla/:id', authenticate, plantilla.obtenerCartasDePlantilla);

/**
 * @swagger
 * /activarPlantilla:
 *   post:
 *     summary: Activar una plantilla para el usuario
 *     tags: [Plantillas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plantillaId:
 *                 type: integer
 *                 description: ID de la plantilla a activar
 *     responses:
 *       200:
 *         description: Plantilla activada exitosamente
 *       400:
 *         description: Plantilla ID inválido
 */
router.post('/activarPlantilla', authenticate, plantilla.activarPlantilla);

/**
 * @swagger
 * /actualizarCarta:
 *   put:
 *     summary: Actualizar una carta en una plantilla
 *     tags: [Plantillas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plantillaId:
 *                 type: integer
 *               cartaidActual:
 *                 type: integer
 *               cartaidNueva:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Carta actualizada exitosamente
 *       400:
 *         description: Carta no encontrada en la plantilla
 *       401:
 *         description: No autorizado para modificar esta plantilla
 */
router.put('/actualizarCarta', authenticate, plantilla.actualizarCarta);

export default router;
