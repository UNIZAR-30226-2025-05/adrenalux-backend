import { Conflict, InternalServer, NotFound, sendResponse, Unauthorized, BadRequest } from '../lib/http.js'
import { createToken } from '../lib/jwt.js'
import { user } from '../db/schemas/user.js';
import { db } from '../config/db.js'; 
import { pbkdf2Sync, randomBytes, randomUUID  } from 'crypto'
import { eq } from 'drizzle-orm'
import { verifyToken } from '../lib/jwt.js';

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
  const { email, password, username, name, lastname } = req.body;

  if (!email || !password || !username || !name || !lastname) {
    return next(new BadRequest("Todos los campos son obligatorios."));
  }

  try {
    const salt = randomBytes(16).toString("hex");
    const hash = pbkdf2Sync(password, salt, HASH_CONFIG.iterations, HASH_CONFIG.keyLength, HASH_CONFIG.digest).toString("hex");
    const generatedFriendCode = await generateUniqueFriendCode();

    await db.insert(user).values({
      email,
      password: hash,
      salt,
      username,
      friend_code: generatedFriendCode,
      name,
      lastname,
    });

    return sendResponse(req, res, {
      status: { httpCode: 201 },
      message: "Usuario registrado exitosamente.",
    });

  } catch (err) {
    console.error("Error en el registro:", err);
    return next(new InternalServer("Ocurrió un error al registrar el usuario."));
  }
}

export async function signIn (req, res, next) {
  const { email, password } = req.body

  console.log('signin data:', email, password)

  const [usuario] = await db
    .select({ id: user.id, salt: user.salt, password: user.password })
    .from(user)
    .where(eq(user.email, email))

  if (!usuario) return next(new NotFound())

  const hash = pbkdf2Sync(password, usuario.salt, HASH_CONFIG.iterations, HASH_CONFIG.keyLength, HASH_CONFIG.digest).toString('hex')

  if (hash !== usuario.password) return next(new Unauthorized())

  const token = await createToken({ id: usuario.id, email: usuario.email })

  res.cookie('session-token', token, COOKIE_OPTIONS)

  return sendResponse(req, res, { data: { token } })
}

export async function signOut (req, res) {
  res.clearCookie('session-token')
  return sendResponse(req, res)
}

const generateUniqueFriendCode = async () => {
  let friendCode;
  let existingCode;

  do {
    friendCode = uuidv4().replace(/-/g, "").substring(0, 10).toUpperCase();
    existingCode = await db.select().from(user).where({ friend_code: friendCode }).first(); 
  } while (existingCode);

  return friendCode;
};


export async function validateToken(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new Unauthorized('Formato de token inválido'));
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Verificar firma JWT
    const decoded = await verifyToken(token);

    const [usuario] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, decoded.id));

    if (!usuario) return next(new NotFound('Usuario no existe'));

    return sendResponse(req, res, { 
      status: { httpCode: 200 },
      data: { isValid: true }
    });
  }catch (err) { 
    return next(new Unauthorized('Token inválido'));
  }
}