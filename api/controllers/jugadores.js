import { db } from '../config/db.js';
import { sendResponse } from '../lib/http.js';
import { BadRequest } from '../lib/http.js';
import { carta } from '../db/schemas/carta.js';
import { sql, eq } from 'drizzle-orm';
import { TIPOS_CARTAS } from '../config/cartas.config.js';
import { CARTA_CONSTANTS } from '../config/cartas.config.js';


export async function insertarCartas(req, res, next) {
  try {
    const playersData = req.body;

    if (!Array.isArray(playersData)) {
      console.error("Error: El body no es un array:", playersData);
      return next(new BadRequest({ message: "Se requiere un array de jugadores" }));
    }

    const results = [];
    for (const player of playersData) {
      try {
        await insertarCartaEnBD(player); 
        results.push({ success: true });
      } catch (error) {
        console.error("Error al insertar jugador:", error);
        results.push({ success: false, error: error.message });
      }
    }

    const insertedCount = results.filter(r => r.success).length;
    sendResponse(req, res, {
      inserted: insertedCount,
      failed: playersData.length - insertedCount
    }, 201);
  } catch (error) {
    console.error('Error en inserción:', error);
  }
}


export async function insertarCartaEnBD(jugador) {
  if (!jugador.photo || !jugador.country || !jugador.name || !jugador.team) {
    console.warn("Faltan campos del jugador, no se insertara");
    return; 
  }
  try {
    await db.insert(carta).values({
      nombre: jugador.name,
      alias: jugador.alias,
      posicion: jugador.position,
      equipo: jugador.team,
      tipo_carta: TIPOS_CARTAS.NORMAL.nombre,
      escudo: jugador.team_shield,
      pais: jugador.country,
      photo: jugador.photo,
      defensa: jugador.ratings.defensa,
      ataque: jugador.ratings.ataque,
      control: jugador.ratings.medio,
    });
  } catch (error) {
    throw new Error('Error al insertar la carta en la base de datos: ' + error.message);
  }
}

async function seleccionarMejoresJugadores(limite, offset) {
  return await db.select().from(carta)
    .orderBy(sql`(${carta.ataque} + ${carta.defensa} + ${carta.control}) DESC`)
    .limit(limite)
    .offset(offset);
}

async function actualizarEstadisticas(cartaRow, tipo_carta, incremento, maximo) {

  const def = Number(cartaRow.defensa) || 0;
  const atq = Number(cartaRow.ataque) || 0;
  const ctrl = Number(cartaRow.control) || 0;

  const inc = Number(incremento) || 0;
  const max = Number(maximo) || 100;

  const updatedStats = {
    defensa: Math.min(def + inc, max),
    ataque: Math.min(atq + inc, max),
    control: Math.min(ctrl + inc, max),
    tipo_carta: tipo_carta
  };

  await db.update(carta)
    .set(updatedStats)
    .where(eq(carta.id, cartaRow.id));

  return { ...cartaRow, ...updatedStats };
}

export async function generarCartasLuxuryXI(req, res, next) {
  try {
    console.log('Constantes:', {
      incremento: CARTA_CONSTANTS.INCREMENTOS.LUXURYXI,
      maximo: CARTA_CONSTANTS.INCREMENTOS.MAX
    });

    const mejoresJugadores = await seleccionarMejoresJugadores(
      CARTA_CONSTANTS.NUMERO_CARTAS.LUXURYXI, 
      0
    );
    console.log('Jugadores raw:', JSON.stringify(mejoresJugadores));
    for (let jugador of mejoresJugadores) {
      try {
        jugador = await actualizarEstadisticas(
          jugador,
          TIPOS_CARTAS.LUXURYXI.nombre,
          CARTA_CONSTANTS.INCREMENTOS.LUXURYXI,
          CARTA_CONSTANTS.INCREMENTOS.MAX
        );
        await insertarCartaEnBD(jugador);
      } catch (error) {
        console.error(`Error procesando jugador ${jugador.id}:`, error);
      }
    }
    return sendResponse(req, res, { 
      message: 'Cartas LuxuryXI generadas exitosamente',
      count: mejoresJugadores.length
    });
  } catch (error) {
    console.error('Error crítico:', error);
    return next(new Error('Error al generar las cartas LuxuryXI: ' + error.message));
  }
}

export async function generarCartasMegaLuxury(req, res, next) {
  try {
    const mejoresJugadores = await seleccionarMejoresJugadores(CARTA_CONSTANTS.NUMERO_CARTAS.MEGALUXURY, CARTA_CONSTANTS.NUMERO_CARTAS.LUXURYXI + 1);
    for (let jugador of mejoresJugadores) {
      jugador = await actualizarEstadisticas(jugador,TIPOS_CARTAS.MEGALUXURY.nombre, CARTA_CONSTANTS.INCREMENTOS.MEGALUXURY, CARTA_CONSTANTS.INCREMENTOS.MAX);
      await insertarCartaEnBD(jugador);
    }
    return sendResponse(req, res, { message: 'Cartas MegaLuxury generadas exitosamente' });
  } catch (error) {
    return next(new Error('Error al generar las cartas MegaLuxury: ' + error.message));
  }
}

export async function generarCartasLuxury(req, res, next) {
  try {
    const mejoresJugadores = await seleccionarMejoresJugadores(CARTA_CONSTANTS.NUMERO_CARTAS.LUXURY, CARTA_CONSTANTS.NUMERO_CARTAS.MEGALUXURY + 1);
    for (let jugador of mejoresJugadores) {
      jugador = await actualizarEstadisticas(jugador,TIPOS_CARTAS.LUXURY.nombre, CARTA_CONSTANTS.INCREMENTOS.LUXURY, CARTA_CONSTANTS.INCREMENTOS.MAX);
      await insertarCartaEnBD(jugador);
    }
    return sendResponse(req, res, { message: 'Cartas Luxury generadas exitosamente' });
  } catch (error) {
    return next(new Error('Error al generar las cartas Luxury: ' + error.message));
  }
}
