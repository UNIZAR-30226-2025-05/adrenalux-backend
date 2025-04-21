import express from 'express';
import * as coleccion from '../controllers/coleccion.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Carta
 *   description: Endpoints relacionados con la colección de cartas
 */

/**
 * @swagger
 * /getColeccion:
 *   get:
 *     summary: Obtener la colección del usuario autenticado
 *     tags: [Carta]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Colección obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       nombreCompleto:
 *                         type: string
 *                       club:
 *                         type: string
 *                       posicion:
 *                         type: string
 *                       nacionalidad:
 *                         type: string
 *                       stats:
 *                         type: object
 *                         properties:
 *                           defensa:
 *                             type: integer
 *                           medio:
 *                             type: integer
 *                           ataque:
 *                             type: integer
 *                       rareza:
 *                         type: string
 *                       foto:
 *                         type: string
 *                       disponible:
 *                         type: boolean
 *                       enVenta:
 *                         type: boolean
 *                       cantidad:
 *                         type: integer
 *       401:
 *         description: No autorizado. Token no válido o ausente
 *       400:
 *         description: Usuario no válido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/getColeccion', authenticate, coleccion.obtenerColeccion);

/**
 * @swagger
 * /filtrarCartas:
 *   get:
 *     summary: Filtrar cartas del usuario según criterios
 *     tags: [Carta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: posicion
 *         schema:
 *           type: string
 *         description: Filtrar por posición
 *       - in: query
 *         name: rareza
 *         schema:
 *           type: string
 *         description: Filtrar por rareza
 *       - in: query
 *         name: equipo
 *         schema:
 *           type: string
 *         description: Filtrar por equipo
 *     responses:
 *       200:
 *         description: Cartas filtradas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Carta'
 *       401:
 *         description: No autorizado. Token no válido o ausente
 *       500:
 *         description: Error al filtrar cartas
 */
router.get('/filtrarCartas', authenticate, coleccion.filtrarCartas);

/**
 * @swagger
 * /filtrarPorEquipo/{equipo}:
 *   get:
 *     summary: Filtrar cartas por nombre de equipo
 *     tags: [Carta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: equipo
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre (parcial o completo) del equipo
 *     responses:
 *       200:
 *         description: Cartas encontradas para el equipo indicado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Carta'
 *       400:
 *         description: No se encontraron cartas para el equipo
 *       401:
 *         description: No autorizado. Token no válido o ausente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/filtrarPorEquipo/:equipo', authenticate, coleccion.filtrarPorEquipo);

/**
 * @swagger
 * components:
 *   schemas:
 *     Carta:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         nombreCompleto:
 *           type: string
 *         club:
 *           type: string
 *         posicion:
 *           type: string
 *         nacionalidad:
 *           type: string
 *         stats:
 *           type: object
 *           properties:
 *             defensa:
 *               type: integer
 *             medio:
 *               type: integer
 *             ataque:
 *               type: integer
 *         rareza:
 *           type: string
 *         foto:
 *           type: string
 *         disponible:
 *           type: boolean
 *         enVenta:
 *           type: boolean
 *         cantidad:
 *           type: integer
 */

export default router;
