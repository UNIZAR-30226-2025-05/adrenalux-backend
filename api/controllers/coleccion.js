import { sendResponse } from '../lib/http.js';
import { Unauthorized, BadRequest } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import { db } from '../config/db.js';
import { coleccion } from '../db/schemas/coleccion.js';
import { carta } from '../db/schemas/carta.js';
import { eq, and, ilike } from 'drizzle-orm';
import {TIPOS_FILTROS,} from '../config/cartas.config.js';
import { cartaState, mercadoCartas } from '../db/schemas/mercado.js';
import { usuarioIdValido } from './auth.js';

export async function obtenerColeccion(req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;

  if (!await usuarioIdValido(userId)) {
    return next(new Unauthorized({ message: 'Usuario no válido' }));
  }
  const coleccion = await obtenerTodasLasCartas();
  const cartasUsuario = await obtenerCartasDeUsuario(userId);
  const resultado = await generarResultadoColeccion(coleccion, cartasUsuario);

  return sendResponse(req, res, { data: resultado });
}

export async function filtrarCartas(req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;
  const parametros = req.query;
  const filtros = aplicarFiltros(parametros);

  const cartasUsuario = await obtenerCartasDeUsuario(userId);
  const coleccionFiltrada = await obtenerTodasLasCartas(filtros);
  const resultado = await generarResultadoColeccion(coleccionFiltrada, cartasUsuario);

  return sendResponse(req, res, { data: resultado });
}

export async function filtrarPorEquipo(req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;
  const { equipo } = req.params;

  if (!await usuarioIdValido(userId)) {
    return next(new Unauthorized({ message: 'Usuario no válido' }));
  }

  try {
    // Usamos ILIKE para buscar coincidencias parciales sin importar mayúsculas
    const cartasFiltradas = await db
      .select()
      .from(carta)
      .where(ilike(carta.equipo, `%${equipo}%`));

    if (cartasFiltradas.length === 0) {
      return next(new BadRequest({ message: 'No se encontraron cartas para el equipo especificado' }));
    }

    return sendResponse(req, res, { data: cartasFiltradas });

  } catch (error) {
    console.error('Error al filtrar cartas por equipo:', error);
    return next(new BadRequest({ message: 'Error al procesar la solicitud' }));
  }
}


export async function obtenerTodasLasCartas(filtros = []) {
  let query = db.select().from(carta);

  if(filtros.length > 0){
    query = query.where(...filtros);
  }

  const cartas = await query;
  return cartas;
}

export async function obtenerCartasDeUsuario(userId, filtros = []) {
  let query = db.select()
    .from(coleccion)
    .where(eq(coleccion.user_id, userId));

  if(filtros.length > 0){
    query = query.where(...condiciones);
  }

  const cartas = await query;
  return cartas;
}


function aplicarFiltros(parametros) {
  const condiciones = [];

  if (parametros[TIPOS_FILTROS.POSICION]) {
    condiciones.push(eq(carta.posicion, parametros[TIPOS_FILTROS.POSICION]));
  }
  if (parametros[TIPOS_FILTROS.RAREZA]) {
    condiciones.push(eq(carta.tipo_carta, parametros[TIPOS_FILTROS.RAREZA]));
  }
  if (parametros[TIPOS_FILTROS.EQUIPO]) {
    condiciones.push(eq(carta.equipo, parametros[TIPOS_FILTROS.EQUIPO]));
  }

  return condiciones;
}

async function generarResultadoColeccion(coleccion, cartasUsuario) {
  const resultado = [];

  for (const carta of coleccion) {
    const cartaUsuario = cartasUsuario.find(cu => cu.carta_id === carta.id);

    if (cartaUsuario) {
      const estado = await db
        .select({ estado: mercadoCartas.estado })
        .from(mercadoCartas)
        .where(and(eq(mercadoCartas.cartaId, cartaUsuario.carta_id), eq(mercadoCartas.vendedorId, cartaUsuario.user_id)));

      const enVenta = estado.some(e => e.estado === cartaState.EN_VENTA);
      resultado.push({
        ...carta,
        enVenta: enVenta,
        disponible: true,
        cantidad: cartaUsuario.cantidad,
      });
    } else {
      resultado.push({
        ...carta,
        enVenta: false,
        disponible: false,
        cantidad: 0,
      });
    }
  }

  return resultado;
}



