import { eq } from 'drizzle-orm';
import {user} from '../db/schemas/user.js';
import { db } from '../config/db.js'; 

export async function agregarMonedas(userId, cantidad) {
  // Obtener datos del usuario de la base de datos
  const [usuario] = await db.select().from(users).where(eq(user.id, userId));
  if (!usuario) throw new Error('Usuario no encontrado');

  // Sumar monedas al usuario en la base de datos
  await db
    .update(user)
    .set({ adrenacoins: usuario.adrenacoins + cantidad })
    .where(eq(user.id, userId));

  return { userId, nuevasMonedas: usuario.adrenacoins + cantidad };
}

export async function restarMonedas(userId, cantidad) {
  // Obtener datos del usuario de la base de datos
  const [usuario] = await db.select().from(user).where(eq(user.id, userId));
  if (!usuario) throw new Error('Usuario no encontrado');

  // Comprobar que el usuario tiene suficientes monedas
  if (usuario.adrenacoins < cantidad) throw new Error('Saldo insuficiente');

  // Restar monedas en la base de datos
  await db
    .update(user)
    .set({ adrenacoins: usuario.adrenacoins - cantidad })
    .where(eq(user.id, userId));

  return { userId, nuevasMonedas: usuario.adrenacoins - cantidad };
}
