const express = require('express');
const cartas = require('../controllers/cartas');

const router = express.Router();


router.get('/api/v1/cartas', cartas.getCartas);
router.get('/api/v1/cartas/:id', cartas.getCartaById);
router.get('/api/v1/cartas/mi-colección', cartas.getMiColeccion);
router.get('/api/v1/cartas/filtrar', cartas.filtrarCartas);

router.get('/api/v1/cartas/sobres', cartas.abrirSobrePorTipo);
router.get('/api/v1/cartas/sobre_random', cartas.abrirSobreGratis);



export default router;