import express from 'express';
import * as coleccion from '../controllers/coleccion.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /getColeccion/{userId}:
 *   get:
 *     summary: Obtener la colección de un usuario
 *     tags: [Carta]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
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
 *                       cantidad:
 *                         type: integer
 *       400:
 *         description: Usuario no válido
 */
router.get('/getColeccion', coleccion.obtenerColeccion);

/**
 * @swagger
 * /filtrarCartas:
 *   get:
 *     summary: Filtrar cartas según parámetros
 *     tags: [Carta]
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
 *                       cantidad:
 *                         type: integer
 *       400:
 *         description: Parámetros no válidos
 */
router.get('/filtrarCartas', coleccion.filtrarCartas);



export default router;
