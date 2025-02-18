import * as friendCtrl from '../controllers/intercambio.js';
import { validateRequest } from '../middlewares/validator.js';
import { authenticate } from '../middlewares/auth.js';
import { Router } from 'express';

const router = Router();

router.post('/send-request', friendCtrl.enviarInvitacion);


export default router;
