import { Unauthorized } from '../lib/http.js'
import passport from 'passport'

export const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(new Unauthorized({ message: 'Authentication error' }))
    if (!user) return next(new Unauthorized({ message: 'Invalid or missing token' }))
    req.user = user
    next()
  })(req, res, next)
}