const express = require('express');
const cartas = require('../controllers/cartas');

const router = express.Router();


router.get('/getAllCartas', cartas.getCartas);
router.get('/getCartasID', cartas.getCartaById);
router.get('/getColeccion', cartas.obtenerColeccion);
router.get('/filtrarCartas', cartas.filtrarCartas);

router.get('/abrirSobre', cartas.abrirSobre);
router.get('/abrirSobreRandom', cartas.abrirSobreRandom);



export default router;