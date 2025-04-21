import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getPartidasPausadas } from '../controllers/partidas.js';  // Importar la función

const router = express.Router();

console.log(getPartidasPausadas);  // Asegúrate de que la función está importada correctamente

router.get('/pausadas', authenticate, getPartidasPausadas); // Usar la función en la ruta

export default router;
