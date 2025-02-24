import { db } from '../config/db.js';
import { sendResponse } from '../lib/http.js';
import { BadRequest } from '../lib/http.js';
import { carta } from '../db/schemas/carta.js';
import { TIPOS_CARTAS } from '../config/cartas.config.js';
import { CARTA_CONSTANTS } from '../config/cartas.config.js';


// Controlador para insertar múltiples cartas en la base de datos
export async function insertarCartas(req, res, next) {
  const { jugadores } = req.body;

  if (!Array.isArray(jugadores)) {
    return next(new BadRequest({ message: 'El cuerpo de la solicitud debe ser un array de jugadores' }));
  }

  try {
    for (const jugador of jugadores) {
      await insertarCartaEnBD(jugador);
    }
    return sendResponse(req, res, { message: 'Cartas insertadas exitosamente' });
  } catch (error) {
    return next(new Error('Error al insertar las cartas: ' + error.message));
  }
}
export async function insertarCartaEnBD(jugador) {
  try {
    await db.insert(carta).values({
      name: jugador.name,
      alias: jugador.alias,
      position: jugador.position,
      team: jugador.team,
      tipo_carta: TIPOS_CARTAS.NORMAL,
      team_shield: jugador.team_shield,
      country: jugador.country,
      photo: jugador.photo,
      ratings: JSON.stringify(jugador.ratings),
    });
  } catch (error) {
    throw new Error('Error al insertar la carta en la base de datos: ' + error.message);
  }
}

async function seleccionarMejoresJugadores(limite, offset) {
  return await db.select().from(carta)
    .orderByRaw('(ratings->>\'ataque\')::int + (ratings->>\'medio\')::int + (ratings->>\'defensa\')::int DESC')
    .limit(limite)
    .offset(offset);
}

function actualizarEstadisticas(carta, incremento, maximo)  {
  max =  maximo = CARTA_CONSTANTS.INCREMENTOS.MAX;
  const nuevasEstadisticas = { ...carta.ratings };
  for (const key in nuevasEstadisticas) {
    nuevasEstadisticas[key] = Math.min(nuevasEstadisticas[key] + incremento[key], maximo);
  }
  return nuevasEstadisticas;
}

export async function generarCartasLuxuryXI(req, res, next) {
  try {
    const mejoresJugadores = await seleccionarMejoresJugadores(CARTA_CONSTANTS.NUMERO_CARTAS.LUXURYXI);
    for (const jugador of mejoresJugadores) {
      // ACTUALIZAR STATS
      //AÑADIR A LA BASE DE DATOS
    }
    return sendResponse(req, res, { message: 'Cartas LuxuryXI generadas exitosamente' });
  } catch (error) {
    return next(new Error('Error al generar las cartas LuxuryXI: ' + error.message));
  }
}

export async function generarCartasMegaLuxury(req, res, next) {
  try {
    const mejoresJugadores = await seleccionarMejoresJugadores(CARTA_CONSTANTS.NUMERO_CARTAS.MEGALUXURY, CARTA_CONSTANTS.NUMERO_CARTAS.LUXURYXI);
    for (const jugador of mejoresJugadores) {
    // ACTUALIZAR STATS
    //AÑADIR A LA BASE DE DATOS
      
    }
    return sendResponse(req, res, { message: 'Cartas MegaLuxury generadas exitosamente' });
  } catch (error) {
    return next(new Error('Error al generar las cartas MegaLuxury: ' + error.message));
  }
}

export async function generarCartasLuxury(req, res, next) {
  try {
    const mejoresJugadores = await seleccionarMejoresJugadores(CARTA_CONSTANTS.NUMERO_CARTAS.LUXURY, CARTA_CONSTANTS.NUMERO_CARTAS.LUXURYXI + CARTA_CONSTANTS.NUMERO_CARTAS.MEGALUXURY);
    for (const jugador of mejoresJugadores) {
      // ACTUALIZAR STATS
      //AÑADIR A LA BASE DE DATOS
    }
    return sendResponse(req, res, { message: 'Cartas Luxury generadas exitosamente' });
  } catch (error) {
    return next(new Error('Error al generar las cartas Luxury: ' + error.message));
  }
}