import { Conflict, InternalServer, NotFound, sendResponse, Unauthorized } from '../lib/http.js'
import { createToken } from '../lib/jwt.js'
//import { users } from '../db/schemas/users.js';
import { db } from '../config/db.js'; 
import { pbkdf2Sync, randomBytes } from 'crypto'
import { eq } from 'drizzle-orm'

const HASH_CONFIG = {
  iterations: 100000,
  keyLength: 64,
  digest: 'sha512'
}

const COOKIE_OPTIONS = {
  signed: true,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 1 * 60 * 60 * 1000
}

export async function signUp(req, res, next) {
  const { email, password } = req.body;
  console.log('Email =', email, 'Password =', password);

  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, HASH_CONFIG.iterations, HASH_CONFIG.keyLength, HASH_CONFIG.digest).toString('hex');

  try {
    /*
    const result = await db.insert(user).values({ 
      email, 
      username, 
      name, 
      lastname, 
      friend_code: generateFriendCode(),
      salt, 
      password: hash 
    }).returning({ id: user.id });
    
*/
    return sendResponse(req, res, { status: { httpCode: 201 }});
  } catch (err) {
    return next(new InternalServer());
  }
}

export async function signIn (req, res, next) {
  const { email, password } = req.body

  console.log('signin data:', email, password)

  const [user] = await db
    .select({ id: user.id, salt: user.salt, password: user.password })
    .from(user)
    .where(eq(user.email, email))

  if (!user) return next(new NotFound())

  const hash = pbkdf2Sync(password, user.salt, HASH_CONFIG.iterations, HASH_CONFIG.keyLength, HASH_CONFIG.digest).toString('hex')

  if (hash !== user.password) return next(new Unauthorized())

  const token = await createToken({ id: user.id, email: user.email })

  res.cookie('session-token', token, COOKIE_OPTIONS)
  //decolver los temas de sesion y el nombre de usuario
  // foto de perfil 
  return sendResponse(req, res, { data: { token } })
}

export async function signOut (req, res) {
  res.clearCookie('session-token')
  return sendResponse(req, res)
}


async function generateUniqueFriendCode() {
  let friendCode;
  let exists = true;

  while (exists) {
    friendCode = Math.random().toString(36).substr(2, 9).toUpperCase();

    // Verificar si ya existe en la base de datos
    const [user] = await db.select().from(user).where(eq(user.friend_code, friendCode));

    if (!user) {
      exists = false;
    }
  }

  return friendCode;
}


export async function validateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  // Verificar existencia del header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new Unauthorized('Formato de token inválido'));
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Verificar firma JWT
    const decoded = await verifyToken(token);
    
    // Verificar usuario en base de datos
    const [user] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, decoded.id));

    if (!user) return next(new NotFound('Usuario no existe'));

    // Respuesta exitosa
    return sendResponse(req, res, { 
      status: { httpCode: 200 },
      data: { isValid: true }
    });

  } catch (err) {
    // Manejar diferentes tipos de errores
    const message = err.name === 'TokenExpiredError' 
      ? 'Token expirado' 
      : 'Token inválido';
      
    return next(new Unauthorized(message));
  }
}