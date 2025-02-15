import { db } from '../config/db.js';
import { users } from '../models/users.js';
import { eq } from 'drizzle-orm';
import { sendResponse, NotFound, BadRequest } from '../lib/http.js';

export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) return next(new NotFound('Usuario no encontrado'));

    return sendResponse(req, res, { data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { username, name , lastname, avatar } = req.body;
  
      if (!username&& !name && !lastname && !avatar) {
        return next(new BadRequest('No se enviaron cambios válidos'));
      }
  
     // inserccion bd  
     
      return sendResponse(req, res, { message: 'Perfil actualizado correctamente' });
    } catch (err) {
      next(err);
    }
  }
  
