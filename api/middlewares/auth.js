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

export const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const currentKey = process.env.CURRENT_API_KEY;
  const oldKey = process.env.OLD_API_KEY;
  
  if (apiKey === currentKey) {
    req.keyType = 'current';
    return next();
  }

  if (apiKey === oldKey && Date.now() < (parseInt(process.env.LAST_ROTATION) + parseInt(process.env.GRACE_PERIOD)*1000)) {
    req.keyType = 'old';
    return next();
  }

  res.status(403).json({ error: "Invalid API Key" });
};