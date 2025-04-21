import express from 'express';
import * as mercado from '../controllers/mercado.js';
import { apiKeyAuth, authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MercadoDiario
 *   description: Endpoints del mercado diario
 */

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
router.get('/mercadoDiario/obtenerCartasEspeciales', mercado.obtenerCartasDiarias);

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
router.post('/mercadoDiario/comprarCartaEspecial/:id', authenticate, mercado.comprarCartaDiaria);

/**
 * @swagger
 * tags:
 *   name: MercadoCartas
 *   description: Endpoints del mercado de cartas
 */

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
router.get('/mercadoCartas/obtenerCartasMercado', mercado.obtenerCartasEnVenta);

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
router.post('/mercadoCartas/venderCarta', authenticate, mercado.publicarCarta);

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
router.post('/mercadoCartas/comprarCarta/:id', authenticate, mercado.comprarCarta);

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
router.delete('/mercadoCartas/retirarCarta/:id', authenticate, mercado.retirarCarta);

/**
 * @swagger
 * tags:
 *   name: Administración de Mercado
 *   description: Endpoints de administración del mercado
 */

/**
 * @swagger
 * /generarCartasMercado:
 *   post:
 *     summary: Generar las cartas diarias (requiere API Key)
 *     tags: [Administración]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Cartas generadas exitosamente
 */
router.post('/generarCartasMercado', apiKeyAuth, mercado.generarCartasMercado);

export default router;
