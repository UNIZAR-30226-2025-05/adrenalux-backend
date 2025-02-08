import * as authCtrl from '../controllers/auth.js'
import { validateRequest } from '../middlewares/validator.js'
import { authenticate } from '../middlewares/auth.js'
import { Router } from 'express'
import { z } from 'zod'

const authSchema = {
  body: z.object({
    email: z.string().email({ message: 'with invalid format' }),
    password: z.string().min(6, { message: 'must be at least 6 characters long' })
  })
}

const router = Router()

router.post('/sign-up', validateRequest(authSchema), authCtrl.signUp)
router.post('/sign-in', validateRequest(authSchema), authCtrl.signIn)
router.post('/sign-out', authenticate, authCtrl.signOut)

router.post('/find-match', (req, res) => {

  res.status(200).json({ message: 'Buscando partida...' });
});

export default router