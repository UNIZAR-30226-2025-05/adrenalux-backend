import { db } from '../config/db.js';
import { eq } from 'drizzle-orm';
import { sendResponse, NotFound, BadRequest } from '../lib/http.js';
import { user } from '../db/schemas/user.js';


export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const [usuario] = await db.select().from(user).where(eq(user.id, userId));

    //coger de la base de datos id,name,email,friendCode,photo,adrenacoins,xp,levelxp,puntos,logros,partidas
    //devolver formato json 

    if (!usuario) return next(new NotFound('Usuario no encontrado'));

    return sendResponse(req, res, { data: usuario });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { username, name, lastname, avatar } = req.body;

    if (!username && !name && !lastname && !avatar) {
      return next(new BadRequest('No se enviaron cambios válidos'));
    }

    // Update user data in the database
    // inserccion bd  

    return sendResponse(req, res, { message: 'Perfil actualizado correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function getLevelxp(req, res, next) {
  try {
    const userId = req.user.id;
    // Fetch level XP and experience from the database
    // const levelxp = await db.select().from(users).where(eq(users.id, userId)).select(users.levelxp);
    // const experience = await db.select().from(users).where(eq(users.id, userId)).select(users.xp);
    // Return level XP in JSON format
    return sendResponse(req, res, { data: levelxp });
  } catch (err) {
    next(err);
  }
}

export async function getStats(req, res, next) {
  try {
    const userId = req.user.id;
    // Fetch stats from the database
    // const stats = await db.select().from(users).where(eq(users.id, userId)).select(users.stats);
    // Return stats in JSON format
    return sendResponse(req, res, { data: stats });
  } catch (err) {
    next(err);
  }
}

export async function getAchievements(req, res, next) {
  try {
    const userId = req.user.id;
    // Fetch achievements from the database
    // const achievements = await db.select().from(users).where(eq(users.id, userId)).select(users.achievements);
    // Return achievements in JSON format
    return sendResponse(req, res, { data: achievements });
  } catch (err) {
    next(err);
  }
}

export async function getFriends(req, res, next) {
  try {
    const userId = req.user.id;
    // Fetch friends from the database
    // const friends = await db.select().from(users).where(eq(users.id, userId)).select(users.friends);
    // Return friends in JSON format
    return sendResponse(req, res, { data: friends });
  } catch (err) {
    next(err);
  }
}

export async function getFriendRequests(req, res, next) {
  try {
    const userId = req.user.id;
    // Fetch friend requests from the database
    // const friendRequests = await db.select().from(users).where(eq(users.id, userId)).select(users.friendRequests);
    // Return friend requests in JSON format
    return sendResponse(req, res, { data: friendRequests });
  } catch (err) {
    next(err);
  }
}

export async function sendFriendRequest(req, res, next) {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;
    // Insert friend request into the database
    // await db.insert().into(friendRequests).values({ userId, friendId });
    return sendResponse(req, res, { message: 'Solicitud de amistad enviada correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function getAdrenacoins(req, res, next) {
  try {
    const userId = req.user.id;
    // Fetch adrenacoins from the database
    // const adrenacoins = await db.select().from(users).where(eq(users.id, userId)).select(users.adrenacoins);
    // Return adrenacoins in JSON format
    return sendResponse(req, res, { data: adrenacoins });
  } catch (err) {
    next(err);
  }
}

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
    const userId = req.user.id;

    // Delete user from the database
    // await db.delete().from(users).where(eq(users.id, userId));

    return sendResponse(req, res, { message: 'User account deleted successfully' });
  } catch (err) {
    next(err);
  }
}


export async function updateUserSettings(req, res, next) {
  try {
    const userId = req.user.id;
    const { settings } = req.body;

    if (!settings) {
      return next(new BadRequest('Settings data is required'));
    }

    // Update user settings in the database
    // await db.update(users).set({ settings }).where(eq(users.id, userId));

    return sendResponse(req, res, { message: 'Settings updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function comprobarLogros(userId) {
  const logrosObtenidos = new Map();

  // Obtener los logros que el usuario aún no ha conseguido
  logrosNoConseguidos = {}
  // Obtener datos del usuario
  datos_usuario = {}

  for (const logro of logrosNoConseguidos) {
    if (cumpleRequisitosLogro(logro, datos_usuario)) {
      logrosObtenidos.set(logro.id, logro.tipo);
    }
  }

  if (logrosObtenidos.size === 0) {
    return null;
  }

  await insertarLogros(userId, logrosObtenidos);
  return logrosObtenidos;
}

function cumpleRequisitosLogro(logro, usuario) {
  const requisitos = {
    'Partidas jugadas': usuario.partidas_jugadas,
    'Partidas ganadas': usuario.partidas_ganadas,
    'Sobres abiertos': usuario.sobres_abiertos,
    'Cartas conseguidas': usuario.cartas_conseguidas,
    'Nivel alcanzado': usuario.nivel,
  };

  return requisitos[logro.tipo] >= logro.requisito;
}

async function insertarLogros(userId, logrosObtenidos) {
  // insertar logros obtenidos en la base de datos
}