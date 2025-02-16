import express from 'express';
import * as cartas from '../controllers/cartas.js'; 

const router = express.Router();

//router.get('/getAllCartas', cartas.getCartas());
//router.get('/getCartasID/:id', cartas.getCartaById());
router.get('/getColeccion/:userId', cartas.obtenerColeccion);
router.get('/filtrarCartas', cartas.filtrarCartas);

router.get('/abrirSobre/:tipo', cartas.abrirSobre);
router.get('/abrirSobreRandom', cartas.abrirSobreRandom);

/* Comentadas hasta que se implementen las funciones en el controller
 * router.post('/comprarSobre', cartas.comprarSobre());
 * router.get('/sobresDisponibles/:userId', cartas.sobresDisponibles());
 * router.get('/historialSobres/:userId', cartas.historialSobres());
 * router.post('/intercambiarCartas', cartas.intercambiarCartas());
 * router.get('/ofertasIntercambio/:userId', cartas.obtenerOfertasIntercambio());
 * router.post('/aceptarIntercambio', cartas.aceptarIntercambio());
*/
export default router;
