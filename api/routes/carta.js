const express = require('express');
const cartas = require('../controllers/cartas');

const router = express.Router();

// Rutas de cartas
router.get('/getAllCartas', cartas.getCartas);
router.get('/getCartasID/:id', cartas.getCartaById);
router.get('/getColeccion/:userId', cartas.obtenerColeccion);
router.get('/filtrarCartas', cartas.filtrarCartas);

// Rutas de sobres
router.get('/abrirSobre/:tipo', cartas.abrirSobre);
router.get('/abrirSobreRandom', cartas.abrirSobreRandom);
router.post('/comprarSobre', cartas.comprarSobre);
router.get('/sobresDisponibles/:userId', cartas.sobresDisponibles);
router.get('/historialSobres/:userId', cartas.historialSobres);

// Intercambio de cartas
router.post('/intercambiarCartas', cartas.intercambiarCartas);
router.get('/ofertasIntercambio/:userId', cartas.obtenerOfertasIntercambio);
router.post('/aceptarIntercambio', cartas.aceptarIntercambio);

export default router;
