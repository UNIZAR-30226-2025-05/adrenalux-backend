import express from 'express';
import * as mercadoDiario from '../controllers/mercadoDiario.js';
import * as mercadoCartas from '../controllers/mercadoCartas.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /mercadoDiario/obtenerCartasEspeciales:
 *   get:
 *     summary: Obtener las cartas especiales del día en el mercado
 *     tags: [MercadoDiario]
 *     responses:
 *       200:
 *         description: Lista de cartas especiales en venta hoy
 */
router.get('/mercadoDiario/obtenerCartasEspeciales', mercadoDiario.obtenerCartasDiarias);

/**
 * @swagger
 * /mercadoDiario/comprarCartaEspecial/{id}:
 *   post:
 *     summary: Comprar una carta especial del mercado diario
 *     tags: [MercadoDiario]
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
router.post('/mercadoDiario/comprarCartaEspecial/:id', authenticate, mercadoDiario.comprarCartaDiaria);

/**
 * @swagger
 * /mercadoCartas/obtenerCartasMercado:
 *   get:
 *     summary: Obtener todas las cartas en venta en el mercado de jugadores
 *     tags: [MercadoCartas]
 *     responses:
 *       200:
 *         description: Lista de cartas en venta
 */
router.get('/mercadoCartas/obtenerCartasMercado', mercadoCartas.obtenerCartasEnVenta);

/**
 * @swagger
 * /mercadoCartas/selectCartaMercado/{id}:
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
router.get('/mercadoCartas/selectCartaMercado/:id', mercadoCartas.obtenerCartaPorId);

/**
 * @swagger
 * /mercadoCartas/venderCarta:
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
router.post('/mercadoCartas/venderCarta', authenticate, mercadoCartas.publicarCarta);

/**
 * @swagger
 * /mercadoCartas/comprarCarta/{id}:
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
router.post('/mercadoCartas/comprarCarta/:id', authenticate, mercadoCartas.comprarCarta);

/**
 * @swagger
 * /mercadoCartas/retirarCarta/{id}:
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
router.delete('/mercadoCartas/retirarCarta/:id', authenticate, mercadoCartas.retirarCarta);

export default router;