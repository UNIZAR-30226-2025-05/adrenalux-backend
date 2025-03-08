import express from 'express';
import { 
    solicitarIntercambio, 
    aceptarIntercambio, 
    rechazarIntercambio, 
    solicitarIntercambioAleatorio 
} from '../controllers/intercambios.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Exchange
 *   description: Endpoints de Intercambios
 */

/**
 * @swagger
 * /api/v1/intercambios/solicitar_intercambio/{userId}:
 *   post:
 *     summary: Iniciar un intercambio con otro usuario
 *     tags: [Exchange]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario con el que se quiere intercambiar cartas.
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token de autenticación.
 *     responses:
 *       200:
 *         description: Intercambio iniciado exitosamente.
 *       400:
 *         description: Error en la solicitud.
 */
router.post('/solicitar_intercambio/:userId', authenticate, solicitarIntercambio);

/**
 * @swagger
 * /api/v1/intercambios/aceptar_intercambio:
 *   post:
 *     summary: Aceptar un intercambio
 *     tags: [Exchange]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token de autenticación.
 *     responses:
 *       200:
 *         description: Intercambio aceptado exitosamente.
 *       400:
 *         description: Error en la solicitud.
 */
router.post('/aceptar_intercambio', authenticate, aceptarIntercambio);

/**
 * @swagger
 * /api/v1/intercambios/rechazar_intercambio:
 *   post:
 *     summary: Rechazar un intercambio
 *     tags: [Exchange]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token de autenticación.
 *     responses:
 *       200:
 *         description: Intercambio rechazado exitosamente.
 *       400:
 *         description: Error en la solicitud.
 */
router.post('/rechazar_intercambio', authenticate, rechazarIntercambio);

/**
 * @swagger
 * /api/v1/intercambios/solicitar_intercambio_aleatorio:
 *   post:
 *     summary: Iniciar un intercambio aleatorio
 *     tags: [Exchange]
 *     parameters:
 *       - in: header    
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token de autenticación.
 *     responses:
 *       200:
 *         description: Intercambio aleatorio iniciado exitosamente.
 *       400:
 *         description: Error en la solicitud.
 */
router.post('/solicitar_intercambio_aleatorio', authenticate, solicitarIntercambioAleatorio);

export default router;
