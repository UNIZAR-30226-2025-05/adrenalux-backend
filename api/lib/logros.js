import { db } from '../config/db.js';
import { logro } from '../db/schemas/logro.js';
import { eq, isNull, or, and } from 'drizzle-orm';
import { logrosUsuario } from '../db/schemas/logrosUsuario.js';
import { user } from '../db/schemas/user.js';
import { partida } from '../db/schemas/partida.js';
import { coleccion } from '../db/schemas/coleccion.js';
import{agregarExp} from '../lib/exp.js';
import {agregarMonedas} from '../lib/monedas.js';
import{} from '../lib/monedas.js';

import { TIPOS_DE_LOGROS} from '../config/logros.config.js';

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
  const logrosObtenidos = [];
  const recompensasTotales = {};

  const logrosNoConseguidos = await obtenerLogrosNoConseguidos(userId);
  const estadisticas_user = await obtenerEstadisticas(userId);

  console.log("Logros no conseguidos", logrosNoConseguidos);

  for (const logro of logrosNoConseguidos) {
    const achievement = logro.logro;
    if (cumpleRequisitosLogro(achievement, estadisticas_user)) {
      logrosObtenidos.push(achievement);
      await insertarLogro(userId, achievement.id);

      if (!recompensasTotales[achievement.reward_type]) {
        recompensasTotales[achievement.reward_type] = 0;
      }
      recompensasTotales[achievement.reward_type] += achievement.reward_amount;
    }
  }

  return {
    logrosObtenidos: logrosObtenidos.length > 0 ? logrosObtenidos : null,
    recompensasTotales,
  };
}


async function obtenerLogrosNoConseguidos(userId) {
  return  await db.select()
    .from(logro)
    .leftJoin(logrosUsuario, and(
      eq(logrosUsuario.logro_id, logro.id),
      eq(logrosUsuario.user_id, userId)
    ))
    .where(isNull(logrosUsuario.logro_id));
}

function cumpleRequisitosLogro(logro, estadisticas_user) {
  const requisitos = {
    [TIPOS_DE_LOGROS.PARTIDAS_JUGADAS]: estadisticas_user.partidas_jugadas,
    [TIPOS_DE_LOGROS.PARTIDAS_GANADAS]: estadisticas_user.partidas_ganadas,
    [TIPOS_DE_LOGROS.CARTAS_CONSEGUIDAS]: estadisticas_user.cartas_conseguidas,
    [TIPOS_DE_LOGROS.NIVEL_ALCANZADO]: estadisticas_user.nivel,
  };
  return requisitos[logro.logro_type] >= logro.requirement;
}
  

async function insertarLogro(userId, logroId) {
  console.log('Insertando logro', logroId, 'para el usuario', userId);
  await db.insert(logrosUsuario).values({
    user_id: userId,
    logro_id: logroId,
    created_at: new Date(),
    achieved: true,
  });
}

export async function aplicarRecompensa(userId, tipo, cantidad) {
  if (!cantidad || cantidad <= 0) return;

  switch (tipo) {
    case "XP":
      await agregarExp(userId, cantidad);
      break;
    case "MONEDAS":
      await agregarMonedas(userId, cantidad);
      break;
    default:
      console.warn(`Tipo de recompensa desconocido: ${tipo}`);
  }
}

