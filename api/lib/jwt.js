import { SignJWT } from 'jose'
import passport from 'passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

const SECRET_KEY = new TextEncoder().encode(process.env.SECRET_KEY)

/**
 * Generates a JWT token.
 * @param {Object} payload - The payload to include in the JWT.
 * @returns {Promise<string>} The signed JWT token.
 */
export async function createToken (payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(SECRET_KEY)
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Extracts JWT token from signed cookies.
 * @param {import('express').Request} req - Express request object.
 * @returns {string | null} The extracted token, or null if not found.
 */
function fromCookie (req) {
  let token = null
  if (req && req.signedCookies) {
    token = req.signedCookies['session-token']
  }
  return token
};

const options = {
  jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), fromCookie]),
  secretOrKey: SECRET_KEY
}

passport.use(new Strategy(options, async (jwtPayload, done) => {
  try {
    return done(null, jwtPayload)
  } catch (err) {
    return done(null, false, { message: 'Authentication error' })
  }
}))