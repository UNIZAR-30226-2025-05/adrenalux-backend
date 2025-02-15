import { validateRequest } from '../middlewares/validator.js';
import { authenticate } from '../middlewares/auth.js';
import { Router } from 'express';
import { z } from 'zod';

const profile = require('../controllers/profile.js');

const profileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).max(100).optional(),
  lastname: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  clubfavorito: z.string().max(50).optional(),
  escudo: z.string().url().optional(),
  fondo: z.string().url().optional(),
});

const router = Router();

// Perfil
router.get('/profile', authenticate, profile.getProfile);
router.put('/profile', authenticate, validateRequest(profileSchema), profile.updateProfile);

// Experiencia y logros
router.get('/levelxp', authenticate, profile.getLevelxp);
router.get('/experience', authenticate, profile.getExperience);
router.get('/stats', authenticate, profile.getStats);
router.get('/achievements', authenticate, profile.getAchievements);

// Amigos y solicitudes de amistad
router.get('/friends', authenticate, profile.getFriends);
router.get('/friend-requests', authenticate, profile.getFriendRequests);
router.post('/friend-requests', authenticate, profile.sendFriendRequest);

// Monedas y economía
router.get('/adrenacoins', authenticate, profile.getAdrenacoins);

export default router;
