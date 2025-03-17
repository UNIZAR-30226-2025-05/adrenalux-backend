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
 *     responses:
 *       200:
 *         description: Plantilla creada exitosamente
 */
router.post('/', authenticate, plantilla.crearPlantilla);

/**
 * @swagger
 * /plantillas/{userId}:
 *   get:
 *     summary: Obtener todas las plantillas de un usuario
 *     tags: [Plantillas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de plantillas del usuario
 */
router.get('/getPlantillas', authenticate, plantilla.obtenerPlantillas);

/**
 * @swagger
 * /plantillas/{plantillaId}:
 *   put:
 *     summary: Actualizar nombre de una plantilla
 *     tags: [Plantillas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: plantillaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la plantilla
 *     responses:
 *       200:
 *         description: Plantilla actualizada exitosamente
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
 *           type: string
 *         description: ID de la plantilla
 *     responses:
 *       200:
 *         description: Plantilla eliminada exitosamente
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
 *           type: string
 *         description: ID de la plantilla
 *     responses:
 *       200:
 *         description: Carta agregada exitosamente
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
 *           type: string
 *         description: ID de la plantilla
 *     responses:
 *       200:
 *         description: Lista de cartas de la plantilla
 */
router.get('/:plantillaId/cartas', authenticate, plantilla.obtenerCartasDePlantilla);


router.get('/getCartasPosicion/:posicion', authenticate, plantilla.devolverCartasPosicion);

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
 *           type: string
 *         description: ID de la plantilla
 *       - in: path
 *         name: cartaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la carta
 *     responses:
 *       200:
 *         description: Carta eliminada exitosamente
 */
router.delete('/:plantillaId/cartas/:cartaId', authenticate, plantilla.eliminarCartaDePlantilla);



export default router;