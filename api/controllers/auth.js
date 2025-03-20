import { Conflict, InternalServer, NotFound, sendResponse, Unauthorized, BadRequest } from '../lib/http.js'
import { createToken } from '../lib/jwt.js'
import { user } from '../db/schemas/user.js';
import { db } from '../config/db.js'; 
import { pbkdf2Sync, randomBytes } from 'crypto'
import { v4 as uuidv4} from 'uuid'
import { eq, or } from 'drizzle-orm'
import { verifyToken } from '../lib/jwt.js';
import { OAuth2Client } from 'google-auth-library';

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

const CLIENT_ID_WEB = process.env.GOOGLE_WEB_CLIENT_ID; 
const oAuth2Client = new OAuth2Client(CLIENT_ID_WEB);

export async function googleSignIn(req, res, next) {
  const { tokenId } = req.body;
  
  try {
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokenId,
      audience: CLIENT_ID_WEB 
    });

    const { 
      email, 
      sub: googleId, 
      given_name: name, 
      family_name: lastname 
    } = ticket.getPayload();

    const [existingUser] = await db
      .select()
      .from(user)
      .where(or(
        eq(user.email, email),
        eq(user.google_id, googleId)
      ));

    if (existingUser && !existingUser.google_id) {
      await db.update(user)
        .set({ google_id: googleId })
        .where(eq(user.id, existingUser.id));
    }

    if (!existingUser) {
      const usernameConflict = await db
        .select()
        .from(user)
        .where(eq(user.username, email.split('@')[0]))
        .limit(1);

      const generatedFriendCode = await generateUniqueFriendCode();
      
      await db.insert(user).values({
        email,
        google_id: googleId,
        name: name || '',
        lastname: lastname || '',
        username: usernameConflict.length > 0 
          ? `${email.split('@')[0]}${Math.floor(Math.random() * 1000)}`
          : email.split('@')[0],
        friend_code: generatedFriendCode,
        password: null,
        salt: null
      });
    }

    const [userData] = await db.select()
      .from(user)
      .where(eq(user.email, email));

    const token = await createToken({ id: userData.id, email });
    res.cookie('session-token', token, COOKIE_OPTIONS);

    return sendResponse(req, res, { 
      data: { 
        token,
        isNewUser: !existingUser 
      } 
    });

  } catch (err) {
    console.error('Google Sign-In Error:', err);
    next(new Unauthorized('Error en autenticación con Google'));
  }
}

export async function signUp(req, res, next) {
  const { email, password, username, name, lastname } = req.body;

  // Validar campos requeridos
  if (!email || !password || !username || !name || !lastname) {
    return next(new BadRequest("Todos los campos son obligatorios."));
  }

  try {
    const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, email))  
    .limit(1)
    .then(rows => rows[0]);  
  
    if (existingUser) {
      return sendResponse(req, res, {
        status: { httpCode: 400, errorMessage: "Este correo ya está en uso." },
      });
    }
    
    const existingUsername = await db
      .select()
      .from(user)
      .where(eq(user.username, username))
      .limit(1)
      .then(rows => rows[0]);
    
    if (existingUsername) {
      return sendResponse(req, res, {
        status: { httpCode: 400, errorMessage: "Este nombre de usuario ya está en uso." },
      });
    }

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
    const existingCode = await db
    .select()
    .from(user)
    .where(eq(user.friend_code, friendCode))
    .limit(1)
    .then(rows => rows[0]);
  } while (existingCode);

  return friendCode;
};

export async function validateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new Unauthorized('Formato de token inválido'));
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = await verifyToken(token);
    const result = await db
      .select({
        id: user.id,
        google_id: user.google_id,
      })
      .from(user)
      .where(eq(user.id, decoded.id))
      .limit(1);

      if (result.length === 0) {
        return next(new NotFound('Usuario no existe'));
      }

    req.user = { 
      id: user.id,
      authMethod: user.google_id ? 'google' : 'email' 
    };

    return sendResponse(req, res, { 
      data: { 
        isValid: true,
        authMethod: req.user.authMethod 
      } 
    });
    
  } catch (err) { 
    next(new Unauthorized('Token inválido'));
  }
}

export async function usuarioIdValido(userId) {
  const [usuario] = await db.select().from(user).where(eq(user.id, userId));
  return !!usuario;
}

export async function usuarioGoogleIdValido(googleId) {
  const [usuario] = await db.select()
    .from(user)
    .where(eq(user.google_id, googleId));
  return !!usuario;
}