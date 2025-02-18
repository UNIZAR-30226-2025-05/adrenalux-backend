import * as friendCtrl from '../controllers/intercambio.js';
import { validateRequest } from '../middlewares/validator.js';
import { authenticate } from '../middlewares/auth.js';
import { Router } from 'express';

const router = Router();

router.post('/send-request', friendCtrl.enviarInvitacion);


/* Amigos y solicitudes de amistad
router.get('/friends', authenticate, profile.getFriends);
router.get('/friend-requests', authenticate, profile.getFriendRequests);
router.post('/friend-requests', authenticate, profile.sendFriendRequest);
*/
export default router;
