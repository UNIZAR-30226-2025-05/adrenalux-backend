import express from 'express';
import * as cartas from '../controllers/cartas.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();


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


/**
 * @swagger
 * /getEquipos:
 *   get:
 *     summary: Coger lista de equipos
 *     tags: [Carta]
 *     responses:
 *       200:
 *         description: Lista de equipos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   nombre:
 *                     type: string
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 */
router.get('/getEquipos', authenticate, cartas.getEquipos);

/**
 * @swagger
 * /getInfoSobres:
 *   get:
 *     summary: Coger información de los sobres
 *     tags: 
 *       - Carta
 *     responses:
 *       200:
 *         description: Información detallada de los sobres, incluyendo precios y probabilidades.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sobres_gratuitos:
 *                   type: object
 *                   properties:
 *                     ENERGIA_LUX:
 *                       type: integer
 *                       description: Probabilidad de obtener este sobre gratuito (%)
 *                     ELITE_LUX:
 *                       type: integer
 *                     MASTER_LUX:
 *                       type: integer
 *                 precios_sobres:
 *                   type: object
 *                   properties:
 *                     ENERGIA_LUX:
 *                       type: object
 *                       properties:
 *                         precio:
 *                           type: integer
 *                           description: Precio en monedas
 *                         maximo:
 *                           type: integer
 *                           description: Número máximo que se puede comprar
 *                         intervalo:
 *                           type: integer
 *                           description: Tiempo de espera en milisegundos para obtener otro sobre
 *                     ELITE_LUX:
 *                       type: object
 *                       properties:
 *                         precio:
 *                           type: integer
 *                         maximo:
 *                           type: integer
 *                         intervalo:
 *                           type: integer
 *                     MASTER_LUX:
 *                       type: object
 *                       properties:
 *                         precio:
 *                           type: integer
 *                         maximo:
 *                           type: integer
 *                         intervalo:
 *                           type: integer
 *                 probabilidades_cartas:
 *                   type: object
 *                   properties:
 *                     ENERGIA_LUX:
 *                       type: object
 *                       properties:
 *                         NORMAL:
 *                           type: number
 *                           format: float
 *                           description: Probabilidad (%) de obtener una carta NORMAL
 *                         LUXURY:
 *                           type: number
 *                         MEGALUXURY:
 *                           type: number
 *                         LUXURYXI:
 *                           type: number
 *                     ELITE_LUX:
 *                       type: object
 *                       properties:
 *                         NORMAL:
 *                           type: number
 *                         LUXURY:
 *                           type: number
 *                         MEGALUXURY:
 *                           type: number
 *                         LUXURYXI:
 *                           type: number
 *                     MASTER_LUX:
 *                       type: object
 *                       properties:
 *                         NORMAL:
 *                           type: number
 *                         LUXURY:
 *                           type: number
 *                         MEGALUXURY:
 *                           type: number
 *                         LUXURYXI:
 *                           type: number
 */
router.get('/getInfoSobres', authenticate, cartas.getInfoSobres);


/**
 * @swagger
 * /getPosiciones:
 *   get:
 *     summary: Coger lista de posiciones
 *     tags: [Carta]
 *     responses:
 *       200:
 *         description: Lista de posiciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 */
router.get('/getPosiciones', authenticate ,cartas.getPosiciones);

/**
 * @swagger
 * /sobres:
 *   get:
 *     summary: Coger sobres disponibles
 *     tags: [Carta]
 *     responses:
 *       200:
 *         description: Sobres disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sobres:
 *                   type: object
 *                   properties:
 *                     ELITE_LUX:
 *                       type: integer
 *                     MASTER_LUX:
 *                       type: integer
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 */


router.get('/sobres', authenticate, cartas.sobresDisponibles);


/**
 * @swagger
 * /getRarezascartas:
 *   get:
 *     summary: Obtener rarezas de las cartas
 *     tags: [Carta]
 *     responses:
 *       200:
 *         description: Riquezas de las cartas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rarezas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       nombre:
 *                         type: string
 *                       descripcion:
 *                         type: string
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 */
router.get('/getRarezascartas', authenticate, cartas.getRarezascartas);

export default router;
