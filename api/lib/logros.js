import { db } from '../config/db.js';
import { logro } from '../db/schemas/logro.js';
import { logrosUsuario } from '../db/schemas/logrosUsuario.js';
import { partida } from '../db/schemas/partida.js';
import { coleccion } from '../db/schemas/coleccion.js';

async function obtenerDatosUsuario(userId) {
  return await db.select()
    .from(user)
    .where(user.id.equals(userId));
}

async function obtenerPartidasJugadas(userId) {
  const partidas = await db.select()
    .from(partida)
    .where(partida.user1_id.equals(userId))
    .orWhere(partida.user2_id.equals(userId));
  
  return partidas.length;
}

async function obtenerPartidasGanadas(userId) {
  const partidasGanadas = await db.select()
    .from(partida)
    .where(partida.ganador_id.equals(userId));

  return partidasGanadas.length;
}

async function obtenerCartasConseguidas(userId) {
  const coleccionDeCartas = await db.select()
    .from(coleccion)
    .where(coleccion.user_id.equals(userId));

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
    nivel: usuario.nivel,
  };

  return estadisticas;
}

export async function comprobarLogros(userId) {
  const logrosObtenidos = new Map();

  const logrosNoConseguidos = await obtenerLogrosNoConseguidos(userId);
  const estadisticas_user = await obtenerEstadisticas(userId);

  for (const logro of logrosNoConseguidos) {
    if (cumpleRequisitosLogro(logro, estadisticas_user)) {
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
  return await db.select()
    .from(logro)
    .whereNotExists(
      db.select()
        .from(logrosUsuario)
        .where(logrosUsuario.user_id.equals(userId))
        .where(logrosUsuario.logro_id.equals(logro.id))
    );
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
