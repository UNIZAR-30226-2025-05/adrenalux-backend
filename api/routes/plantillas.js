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
 *       200:
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
 * /getCartasPorPlantilla:
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
router.get('/getCartasporPlantilla', authenticate, plantilla.obtenerCartasDePlantilla);

/**
 * @swagger
 * /getCartasPorPosicion:
 *   get:
 *     summary: Obtener cartas de una posición específica del usuario autenticado
 *     tags: [Plantillas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: posicion
 *         required: true
 *         schema:
 *           type: string
 *         description: Posición de la carta
 *     responses:
 *       200:
 *         description: Lista de cartas en la posición especificada
 *       400:
 *         description: Posición inválida
 */
router.get('/getCartasPorPosicion', authenticate, plantilla.devolverCartasPosicion);

/**
 * @swagger
 * /actualizarCarta:
 *   put:
 *     summary: Eliminar una carta de una plantilla
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
 *       - in: path
 *         name: cartaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la carta
 *     responses:
 *       200:
 *         description: Carta eliminada exitosamente
 *       400:
 *         description: Carta no encontrada en la plantilla
 *       401:
 *         description: No autorizado para modificar esta plantilla
 */
router.put('/actualizarCarta', authenticate, plantilla.actualizarCarta);

export default router;