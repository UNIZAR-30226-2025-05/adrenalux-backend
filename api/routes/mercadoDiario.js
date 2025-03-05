import express from 'express';
import * as mercadoDiario from '../controllers/mercadoDiario.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /mercadoDiario:
 *   get:
 *     summary: Obtener las cartas especiales del día en el mercado
 *     tags: [MercadoDiario]
 *     responses:
 *       200:
 *         description: Lista de cartas especiales en venta hoy
 */
router.get('/obtenerCartasEspeciales', mercadoDiario.obtenerCartasDiarias);

/**
 * @swagger
 * /mercadoDiario/comprar/{id}:
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
router.post('/comprarCartaEspecial/:id', authenticate, mercadoDiario.comprarCartaDiaria);

export default router;
