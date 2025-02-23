import { db } from '../config/db.js';
import { user } from '../db/schemas/user.js';
import { eq } from 'drizzle-orm';

const XP_INCREMENTO_NIVEL = 1.2; // Aumento del requisito de XP por nivel
const ERROR_USUARIO_NO_ENCONTRADO = 'Usuario no encontrado';

export async function agregarExp(userId, cantidad) {
  const usuario = await obtenerUsuario(userId);
  if (!usuario) throw new Error(ERROR_USUARIO_NO_ENCONTRADO);

  const nuevaXp = usuario.xp + cantidad;
  return await comprobarSubidaNivel(usuario, nuevaXp);
}


async function comprobarSubidaNivel(usuario, nuevaXp) {
  const { id: userId, nivel, levelxp } = usuario;
  const xpAnterior = usuario.xp;
  const nivelAnterior = nivel;
  let nivelNuevo = nivel;
  let nuevaXpMax = levelxp;
  let nivelesSubidos = 0;

  while (nuevaXp >= nuevaXpMax) {
    nuevaXp -= nuevaXpMax;
    nivelNuevo += 1;
    nuevaXpMax = Math.floor(nuevaXpMax * XP_INCREMENTO_NIVEL);
    nivelesSubidos += 1;
  }

  // Actualizar la base de datos con los nuevos valores
  await db
    .update(user)
    .set({ xp: nuevaXp, nivel: nivelNuevo, levelxp: nuevaXpMax })
    .where(eq(user.id, userId));

  return {
    xpNuevo: nuevaXp,
    nivel: nivelNuevo,
  };
}


async function obtenerUsuario(userId) {
  const [user] = await db.select().from(user).where(eq(user.id, userId));
  return user || null;
}
