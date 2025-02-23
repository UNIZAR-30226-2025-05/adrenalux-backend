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


router.get('/sobres', cartas.sobresDisponibles);

export default router;
