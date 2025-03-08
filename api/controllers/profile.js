import { db } from '../config/db.js';
import { eq,or } from 'drizzle-orm';
import { sendResponse, NotFound, BadRequest } from '../lib/http.js';
import { user } from '../db/schemas/user.js';
import { partida } from '../db/schemas/partida.js';
import { getDecodedToken } from '../lib/jwt.js';
import { objectToJson } from '../lib/toJson.js';
import { amistad } from '../db/schemas/amistad.js';
import { logro } from '../db/schemas/logro.js';
import { logrosUsuario } from '../db/schemas/logrosUsuario.js';
import{calcularXpNecesaria} from '../lib/exp.js';
import { json } from 'stream/consumers';


export async function getProfile(req, res, next) {
  try {
    const token = await getDecodedToken(req);
    const userId = token.id;

    // Consulta usuario
    const [usuario] = await db.select().from(user).where(eq(user.id, userId));
    if (!usuario) return next(new NotFound('Usuario no encontrado'));

    let logros = [];
    try {
      logros = await db
        .select()
        .from(logrosUsuario)
        .leftJoin(logro, eq(logrosUsuario.logro_id, logro.id))
        .where(eq(logrosUsuario.user_id, userId));

      if (logros.length === 0) {
        console.log('El usuario no tiene logros.');
      }
    } catch (logrosError) {
      console.error('Error al obtener logros:', logrosError);
      return next(logrosError);
    }

    let partidas = [];
    try {
      partidas = await db
        .select()
        .from(partida)
        .where(or(
          eq(partida.user1_id, userId),
          eq(partida.user2_id, userId)
        ));

      if (partidas.length === 0) {
        console.log('El usuario no tiene partidas.');
      }
    } catch (partidasError) {
      console.error('Error al obtener partidas:', partidasError);
      return next(partidasError);
    }

    const usuarioJson = objectToJson(usuario);
    const logrosJson = logros.map(logro => objectToJson(logro));
    const partidasJson = partidas.map(partida => objectToJson(partida));
    const xpMax = calcularXpNecesaria(usuario.level);

    const responseJson = {
      ...usuarioJson,
      logros: logrosJson,
      partidas: partidasJson,
      xpMax: xpMax,
    };
    
    return sendResponse(req, res, { data: responseJson });
  } catch (err) {
    console.error("Error inesperado:", err);
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const token = await getDecodedToken(req);
    const userId = token.id;

    console.log("Token decodificado:", token);
    console.log("ID de usuario:", userId);

    const { username, name, lastname, avatar } = req.body;

    // Verificar si el usuario existe
    const [usuario] = await db.select().from(user).where(eq(user.id, userId));
    if (!usuario) return next(new NotFound('Usuario no encontrado'));

    await db
      .update(user)
      .set({
        username: username || usuario.username,
        name: name || usuario.name,
        lastname: lastname || usuario.lastname,
        avatar: avatar || usuario.avatar,
      })
      .where(eq(user.id, userId));

    return sendResponse(req, res, { status: 204 });
  } catch (err) {
    next(err);
  }
}


export async function getLevelxp(req, res, next) {
  try {
    const token = await getDecodedToken(req);
    const userId = token.id;

    const [usuario] = await db
      .select({ level: user.level, experience: user.experience })
      .from(user)
      .where(eq(user.id, userId));

    if (!usuario) return next(new NotFound('Usuario no encontrado'));

    const responseJson = {
      level: usuario.level,
      experience: usuario.experience,
    };

    return sendResponse(req, res, { data: responseJson });
  } catch (err) {
    next(err);
  }
}

export async function getClasificacion(req, res, next) {
  try {
    const token = await getDecodedToken(req);
    const userId = token.id;

    const [usuario] = await db
      .select({ puntosClasificacion: user.puntosClasificacion })
      .from(user)
      .where(eq(user.id, userId));

    if (!usuario) return next(new NotFound('Usuario no encontrado'));

    const responseJson = {
      puntosClasificacion: usuario.puntosClasificacion,
    };

    return sendResponse(req, res, { data: responseJson });
  } catch (err) {
    next(err);
  }
}


export async function getAchievements(req, res, next) {
  try {
    const token = await getDecodedToken(req);
    const userId = token.id;

    const [usuario] = await db.select().from(user).where(eq(user.id, userId));
    if (!usuario) return next(new NotFound('Usuario no encontrado'));

    let logros = [];
    try {
      logros = await db
        .select()
        .from(logrosUsuario)
        .leftJoin(logro, eq(logrosUsuario.logro_id, logro.id))
        .where(eq(logrosUsuario.user_id, userId));

      if (logros.length === 0) {
        console.log('El usuario no tiene logros.');
      }
    } catch (logrosError) {
      console.error('Error al obtener logros:', logrosError);
      return next(logrosError);
    }
    const logrosJson = logros.map(logro => objectToJson(logro));



    return sendResponse(req, res, { data: logrosJson });
  } catch (err) {
    next(err);
  }
}

export async function sendFriendRequest(req, res, next) {
  try {
    const token = await getDecodedToken(req);
    const userId = token.id;
    const { friendCode } = req.body;

    // Verificar si el usuario existe
    
    // Verificar q el codigo de amigo no sea el tuyo 
    // obtener el id del amigo
    // Verificar si el usuario ya es amigo

    // Insertar solicitud de amistad en la base de datos

    await db.insert(amistad).values({
      user1_id: userId,
      user2_id: friendCode,
      estado: 'penddiente',
    });

    return sendResponse(req, res, { message: 204 });
  } catch (err) {
    next(err);
  }
}

export async function getAdrenacoins(req, res, next) {
  try {
    const token = await getDecodedToken(req);
    const userId = token.id;

    const [usuario] = await db
      .select({ adrenacoins: user.adrenacoins })
      .from(user)
      .where(eq(user.id, userId));

    if (!usuario) return next(new NotFound('Usuario no encontrado'));

    const responseJson = {
      adrenacoins: usuario.adrenacoins,
    };

    return sendResponse(req, res, { data: responseJson });
  } catch (err) {
    next(err);
  }
}


// no implementado
export async function updatePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return next(new BadRequest('Both old and new passwords are required'));
    }

    // Verify old password and update to new password in the database
    // const user = await db.select().from(users).where(eq(users.id, userId));
    // if (!user || user.password !== oldPassword) {
    //   return next(new BadRequest('Old password is incorrect'));
    // }
    // await db.update(users).set({ password: newPassword }).where(eq(users.id, userId));

    return sendResponse(req, res, { message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const token = await getDecodedToken(req);
    const userId = token.id;

    // Delete user account from the database
     await db.delete().from(users).where(eq(users.id, userId));
   
    return sendResponse(req, res, { message: 'User account deleted successfully' });
  } catch (err) {
    next(err);
  }
}
