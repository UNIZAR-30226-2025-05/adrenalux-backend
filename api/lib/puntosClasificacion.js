import { db } from '../config/db.js';
import { users } from '../db/schemas/user.js';
import { eq } from 'drizzle-orm';

export async function agregarPuntosClasificacion(userId, cantidad) {
  const [usuario] = await db.select().from(users).where(eq(users.id, userId));
  if (!usuario) throw new Error('Usuario no encontrado');

  await db
    .update(users)
    .set({ puntosClasificacion: usuario.puntosClasificacion + cantidad })
    .where(eq(users.id, userId));

  return { userId, nuevosPuntosClasificacion: usuario.puntosClasificacion + cantidad };
}

export async function restarPuntosClasificacion(userId, cantidad) {
  const [usuario] = await db.select().from(users).where(eq(users.id, userId));
  if (!usuario) throw new Error('Usuario no encontrado');

  const nuevosPuntos = Math.max(usuario.puntosClasificacion - cantidad, 0);

  await db
    .update(users)
    .set({ puntosClasificacion: nuevosPuntos })
    .where(eq(users.id, userId));

  return { userId, nuevosPuntosClasificacion: nuevosPuntos };
}
