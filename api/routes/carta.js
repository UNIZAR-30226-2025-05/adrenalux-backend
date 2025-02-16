import express from 'express';
import * as cartas from '../controllers/cartas.js';


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
router.get('/getColeccion/:userId', cartas.obtenerColeccion);

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
router.get('/filtrarCartas', cartas.filtrarCartas);

/**
 * @swagger
 * /abrirSobre/{tipo}:
 *   get:
 *     summary: Abrir un sobre de un tipo específico
 *     tags: [Carta]
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo de sobre
 *     responses:
 *       200:
 *         description: Sobre abierto exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     cartas:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nombreCompleto:
 *                             type: string
 *                           club:
 *                             type: string
 *                           posicion:
 *                             type: string
 *                           nacionalidad:
 *                             type: string
 *                           stats:
 *                             type: object
 *                             properties:
 *                               defensa:
 *                                 type: integer
 *                               medio:
 *                                 type: integer
 *                               ataque:
 *                                 type: integer
 *                           rareza:
 *                             type: string
 *                           foto:
 *                             type: string
 *       400:
 *         description: Tipo de sobre no definido
 *       401:
 *         description: Monedas insuficientes
 */
router.get('/abrirSobre/:tipo', cartas.abrirSobre);

/**
 * @swagger
 * /abrirSobreRandom:
 *   get:
 *     summary: Abrir un sobre aleatorio
 *     tags: [Carta]
 *     responses:
 *       200:
 *         description: Sobre abierto exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     tipo:
 *                       type: string
 *                     cartas:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nombreCompleto:
 *                             type: string
 *                           club:
 *                             type: string
 *                           posicion:
 *                             type: string
 *                           nacionalidad:
 *                             type: string
 *                           stats:
 *                             type: object
 *                             properties:
 *                               defensa:
 *                                 type: integer
 *                               medio:
 *                                 type: integer
 *                               ataque:
 *                                 type: integer
 *                           rareza:
 *                             type: string
 *                           foto:
 *                             type: string
 *       400:
 *         description: Tipo de sobre no definido
 *       401:
 *         description: No tienes sobres gratis disponibles
 */
router.get('/abrirSobreRandom', cartas.abrirSobreRandom);

/* Comentadas hasta que se implementen las funciones en el controller
 * router.post('/comprarSobre', cartas.comprarSobre());
 * router.get('/sobresDisponibles/:userId', cartas.sobresDisponibles());
 * router.get('/historialSobres/:userId', cartas.historialSobres());
 * router.post('/intercambiarCartas', cartas.intercambiarCartas());
 * router.get('/ofertasIntercambio/:userId', cartas.obtenerOfertasIntercambio());
 * router.post('/aceptarIntercambio', cartas.aceptarIntercambio());
*/

export default router;
