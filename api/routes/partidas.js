import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as partidas from '../controllers/partidas.js';

const router = express.Router();


router.get('/pausadas', authenticate, partidas.getPartidasPausadas);

export default router;
