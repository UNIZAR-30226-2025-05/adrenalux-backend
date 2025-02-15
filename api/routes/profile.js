const express = require('express');
const cartas = require('../controllers/profile');

const router = express.Router();


router.get('/getProfile', authenticate, getProfile);
router.get('/getLevelxp', authenticate, getLevelxp);
router.get('/getStats', authenticate, getStats);
router.get('/getAchievements', authenticate, getAchievements);
router.get('/getFriends', authenticate, getFriends);
router.put('/setProfile', authenticate, updateProfile);


export default router;