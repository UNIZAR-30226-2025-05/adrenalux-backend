import { SignJWT } from 'jose'
import passport from 'passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { jwtVerify } from 'jose';
import { Unauthorized } from './http.js'

import * as dotenv from "dotenv";

dotenv.config();

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
    .setExpirationTime('1y')
    .sign(SECRET_KEY)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload; // Retorna el payload si la verificación es exitosa
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
}

/**
 * Extracts JWT token from signed cookies.
 * @param {import('express').Request} req - Express request object.
 * @returns {string | null} The extracted token, or null if not found.
 */
export function fromCookie (req) {
  let token = null
  if (req && req.signedCookies) {
    token = req.signedCookies['session-token']
  }
  return token
};

export async function getDecodedToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Unauthorized('Formato de token inválido');
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = await verifyToken(token);
    return decoded;
    
  } catch (err) { 
    return new Unauthorized('Token inválido');
  }
}

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