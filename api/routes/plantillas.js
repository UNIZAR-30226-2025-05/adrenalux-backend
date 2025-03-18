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
router.put('/:plantillaId', authenticate, plantilla.actualizarPlantilla);

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
router.delete('/:plantillaId', authenticate, plantilla.eliminarPlantilla);

/**
 * @swagger
 * /plantillas/{plantillaId}/cartas:
 *   post:
 *     summary: Agregar una carta a una plantilla
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
 *               cartaid:
 *                 type: integer
 *                 description: ID de la carta
 *               posicion:
 *                 type: string
 *                 description: Posición de la carta en la plantilla
 *     responses:
 *       200:
 *         description: Carta agregada exitosamente
 *       400:
 *         description: Posición inválida o carta no encontrada
 *       401:
 *         description: No autorizado para modificar esta plantilla
 */
router.post('/:plantillaId/cartas', authenticate, plantilla.agregarCartaAPlantilla);

/**
 * @swagger
 * /plantillas/{plantillaId}/cartas:
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
router.get('/:plantillaId/cartas', authenticate, plantilla.obtenerCartasDePlantilla);

/**
 * @swagger
 * /plantillas/cartas/posicion/{posicion}:
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
router.get('/cartas/posicion/:posicion', authenticate, plantilla.devolverCartasPosicion);

/**
 * @swagger
 * /plantillas/{plantillaId}/cartas/{cartaId}:
 *   delete:
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
router.delete('/:plantillaId/cartas/:cartaId', authenticate, plantilla.eliminarCartaDePlantilla);

export default router;