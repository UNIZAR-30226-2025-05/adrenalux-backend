import { db } from '../config/db.js';
import { logro } from '../db/schemas/logro.js';
import { eq, isNull, or } from 'drizzle-orm';
import { logrosUsuario } from '../db/schemas/logrosUsuario.js';
import { user } from '../db/schemas/user.js';
import { partida } from '../db/schemas/partida.js';
import { coleccion } from '../db/schemas/coleccion.js';

async function obtenerDatosUsuario(userId) {
  const [usuario] = await db.select()
  .from(user)
  .where(eq(user.id, userId));
  return usuario;
}

async function obtenerPartidasJugadas(userId) {
  const partidas = await db.select()
    .from(partida)
    .where(
      or(
        eq(partida.user1_id, userId),
        eq(partida.user2_id, userId)
      )
    );
  
  return partidas.length;
}

async function obtenerPartidasGanadas(userId) {
  const partidasGanadas = await db.select()
    .from(partida)
    .where(eq(partida.ganador_id, userId));

  return partidasGanadas.length;
}

async function obtenerCartasConseguidas(userId) {
  const coleccionDeCartas = await db.select()
    .from(coleccion)
    .where(eq(coleccion.user_id, userId));

  return coleccionDeCartas.length;
}

export async function obtenerEstadisticas(userId) {
  const partidasJugadas = await obtenerPartidasJugadas(userId);
  const partidasGanadas = await obtenerPartidasGanadas(userId);
  const cartasConseguidas = await obtenerCartasConseguidas(userId);
  const usuario = await obtenerDatosUsuario(userId);

  const estadisticas = {
    partidas_jugadas: partidasJugadas,
    partidas_ganadas: partidasGanadas,
    cartas_conseguidas: cartasConseguidas,
    nivel: usuario.level,
  };

  return estadisticas;
}

export async function comprobarLogros(userId) {
  const logrosObtenidos = new Map();

  const logrosNoConseguidos = await obtenerLogrosNoConseguidos(userId);
  const estadisticas_user = await obtenerEstadisticas(userId);

  for (const logro of logrosNoConseguidos) {
    if (cumpleRequisitosLogro(logro, estadisticas_user)) {
      console.log("Logro obtenido:", logro);
      logrosObtenidos.set(logro, logro.tipo);
      await insertarLogro(userId, logro.id);
    }
  }

  if (logrosObtenidos.size === 0) {
    return null;
  }

  return logrosObtenidos;
}

async function obtenerLogrosNoConseguidos(userId) {
  return  await db.select()
    .from(logro)
    .leftJoin(logrosUsuario, eq(logrosUsuario.logro_id, logro.id))
    .where(eq(logrosUsuario.user_id, userId))
    .where(isNull(logrosUsuario.logro_id));
}

function cumpleRequisitosLogro(logro, estadisticas_user) {
  const requisitos = {
    'Partidas jugadas': estadisticas_user.partidas_jugadas,
    'Partidas ganadas': estadisticas_user.partidas_ganadas,
    'Cartas conseguidas': estadisticas_user.cartas_conseguidas,
    'Nivel alcanzado': estadisticas_user.nivel,
  };

  return requisitos[logro.tipo] >= logro.requisito;
}

async function insertarLogro(userId, logroId) {
  await db.insert(logrosUsuario).values({
    user_id: userId,
    logro_id: logroId,
    created_at: new Date(),
    achieved: true,
  });
}
