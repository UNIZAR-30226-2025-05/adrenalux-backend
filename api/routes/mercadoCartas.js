import express from 'express';
import * as mercadoCartas from '../controllers/mercadoCartas.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /mercadoCartas:
 *   get:
 *     summary: Obtener todas las cartas en venta en el mercado de jugadores
 *     tags: [MercadoCartas]
 *     responses:
 *       200:
 *         description: Lista de cartas en venta
 */
router.get('/obtenerCartasMercado', mercadoCartas.obtenerCartasEnVenta);

/**
 * @swagger
 * /mercadoCartas/{id}:
 *   get:
 *     summary: Obtener información de una carta en el mercado por ID
 *     tags: [MercadoCartas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Información de la carta en venta
 */
router.get('/selectCartaMercado/:id', mercadoCartas.obtenerCartaPorId);

/**
 * @swagger
 * /mercadoCartas:
 *   post:
 *     summary: Publicar una carta en venta en el mercado
 *     tags: [MercadoCartas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               carta_id:
 *                 type: integer
 *               precio:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Carta puesta en venta exitosamente
 */
router.post('/venderCarta', authenticate, mercadoCartas.publicarCarta);

/**
 * @swagger
 * /mercadoCartas/comprar/{id}:
 *   post:
 *     summary: Comprar una carta en el mercado
 *     tags: [MercadoCartas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Carta comprada exitosamente
 */
router.post('/comprarCarta/:id', authenticate, mercadoCartas.comprarCarta);

/**
 * @swagger
 * /mercadoCartas/{id}:
 *   delete:
 *     summary: Retirar una carta del mercado (solo el vendedor puede hacerlo)
 *     tags: [MercadoCartas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Carta retirada del mercado
 */
router.delete('/retirarCarta/:id', authenticate, mercadoCartas.retirarCarta);

export default router;
