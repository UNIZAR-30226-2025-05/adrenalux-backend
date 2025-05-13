import { db } from '../config/db.js';
import { sendResponse, BadRequest } from '../lib/http.js';
import { carta } from '../db/schemas/carta.js';
import { sql, eq } from 'drizzle-orm';
import { TIPOS_CARTAS, CARTA_CONSTANTS, DISTRIBUCION_POSICIONES } from '../config/cartas.config.js';

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
    console.warn("Faltan campos del jugador, no se insertará");
    return;
  }
  try {
    await db.insert(carta).values({
      nombre: jugador.name,
      alias: jugador.alias,
      posicion: jugador.position,
      equipo: jugador.team,
      tipo_carta: TIPOS_CARTAS.NORMAL.nombre,
      escudo: jugador.escudo,
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

// 🔁 Versión mejorada que evita jugadores repetidos
async function seleccionarMejoresJugadoresPorPosicion(tipoCarta, idsSeleccionados = new Set()) {
  const distribucion = DISTRIBUCION_POSICIONES[tipoCarta];
  const jugadoresSeleccionados = [];

  for (const [posicion, cantidad] of Object.entries(distribucion)) {
    const jugadores = await db.select()
      .from(carta)
      .where(
        sql`${carta.posicion} = ${posicion} AND ${carta.id} NOT IN (${Array.from(idsSeleccionados).join(',') || 'NULL'})`
      )
      .orderBy(sql`(${carta.ataque} + ${carta.defensa} + ${carta.control}) DESC`)
      .limit(cantidad);

    jugadores.forEach(j => idsSeleccionados.add(j.id));
    jugadoresSeleccionados.push(...jugadores);
  }

  return jugadoresSeleccionados;
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
    const idsUsados = new Set();

    const jugadores = await seleccionarMejoresJugadoresPorPosicion('LUXURYXI', idsUsados);

    for (let jugador of jugadores) {
      await actualizarEstadisticas(
        jugador,
        TIPOS_CARTAS.LUXURYXI.nombre,
        CARTA_CONSTANTS.INCREMENTOS.LUXURYXI,
        CARTA_CONSTANTS.INCREMENTOS.MAX
      );
    }

    return sendResponse(req, res, {
      message: 'Cartas LuxuryXI generadas exitosamente',
      count: jugadores.length
    });
  } catch (error) {
    console.error('Error generando LuxuryXI:', error);
    return next(new Error('Error al generar las cartas LuxuryXI: ' + error.message));
  }
}

export async function generarCartasMegaLuxury(req, res, next) {
  try {
    const idsUsados = new Set();

    await seleccionarMejoresJugadoresPorPosicion('LUXURYXI', idsUsados);

    const jugadores = await seleccionarMejoresJugadoresPorPosicion('MEGALUXURY', idsUsados);

    for (let jugador of jugadores) {
      await actualizarEstadisticas(
        jugador,
        TIPOS_CARTAS.MEGALUXURY.nombre,
        CARTA_CONSTANTS.INCREMENTOS.MEGALUXURY,
        CARTA_CONSTANTS.INCREMENTOS.MAX
      );
    }

    return sendResponse(req, res, {
      message: 'Cartas MegaLuxury generadas exitosamente',
      count: jugadores.length
    });
  } catch (error) {
    return next(new Error('Error al generar las cartas MegaLuxury: ' + error.message));
  }
}

export async function generarCartasLuxury(req, res, next) {
  try {
    const idsUsados = new Set();

    await seleccionarMejoresJugadoresPorPosicion('LUXURYXI', idsUsados);
    await seleccionarMejoresJugadoresPorPosicion('MEGALUXURY', idsUsados);

    const jugadores = await seleccionarMejoresJugadoresPorPosicion('LUXURY', idsUsados);

    for (let jugador of jugadores) {
      await actualizarEstadisticas(
        jugador,
        TIPOS_CARTAS.LUXURY.nombre,
        CARTA_CONSTANTS.INCREMENTOS.LUXURY,
        CARTA_CONSTANTS.INCREMENTOS.MAX
      );
    }

    return sendResponse(req, res, {
      message: 'Cartas Luxury generadas exitosamente',
      count: jugadores.length
    });
  } catch (error) {
    return next(new Error('Error al generar las cartas Luxury: ' + error.message));
  }
}
