import { Conflict, sendResponse } from '../lib/http.js';
import { Unauthorized, BadRequest } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import fs from 'fs';
import path from 'path';
import { db } from '../config/db.js';
import { coleccion } from '../db/schemas/coleccion.js';
import { carta } from '../db/schemas/carta.js';
import { user } from '../db/schemas/user.js';
import { eq } from 'drizzle-orm';
import { TIPOS_FILTROS } from '../config/cartas.config.js';


import {
  TIPOS_FILTROS,
} from '../config/cartas.config.js';

export async function obtenerColeccion(req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;

  if (!await usuarioIdValido(userId)) {
    return next(new BadRequest({ message: 'Usuario no válido' }));
  }
  const coleccion = await obtenerTodasLasCartas();
  const cartasUsuario = await obtenerCartasDeUsuario(userId);
  const resultado = await generarResultadoColeccion(coleccion, cartasUsuario, userId);

  return sendResponse(req, res, { data: resultado });
}

export async function filtrarCartas(req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;
  const parametros = req.query;
  const filtros = aplicarFiltros(parametros);

  const cartasUsuario = await obtenerCartasDeUsuario(userId, filtros);
  const coleccionFiltrada = await obtenerTodasLasCartas(filtros);
  const resultado = await generarResultadoColeccion(coleccionFiltrada, cartasUsuario, userId);

  return sendResponse(req, res, { data: resultado });
}

export async function obtenerTodasLasCartas(filtros) {
  let query = db.select().from(carta);

  const condiciones = [];
  if(filtros[TIPOS_FILTROS.POSICION]){
    condiciones.push(eq(carta.posicion, filtros[TIPOS_FILTROS.POSICION]));
  }
  if(filtros[TIPOS_FILTROS.RAREZA]){
    condiciones.push(eq(carta.tipo_carta, filtros[TIPOS_FILTROS.RAREZA]));
  }
  if(filtros[TIPOS_FILTROS.EQUIPO]){
    condiciones.push(eq(carta.equipo, filtros[TIPOS_FILTROS.EQUIPO]));
  }

  const cartas = await query;
  return cartas;
}

export async function obtenerCartasDeUsuario(userId, filtros = {}) {
  let query = db.select()
    .from(coleccion)
    .innerJoin(carta, eq(carta.id, coleccion.carta_id)) // Unir con la tabla de cartas
    .where(eq(coleccion.user_id, userId));

  const condiciones = [];
  if(filtros[TIPOS_FILTROS.POSICION]){
    condiciones.push(eq(carta.posicion, filtros[TIPOS_FILTROS.POSICION]));
  }
  if(filtros[TIPOS_FILTROS.RAREZA]){
    condiciones.push(eq(carta.tipo_carta, filtros[TIPOS_FILTROS.RAREZA]));
  }
  if(filtros[TIPOS_FILTROS.EQUIPO]){
    condiciones.push(eq(carta.equipo, filtros[TIPOS_FILTROS.EQUIPO]));
  }

  const cartas = await query;
  return cartas;
}

async function obtenerCantidadCarta(userId, cartaId) { //Obtiene la cantidad de una carta que tiene un usuario
  const [entry] = await db.select().from(coleccion).where(and(eq(coleccion.user_id, userId), eq(coleccion.carta_id, cartaId)));
  return entry ? entry.cantidad : 0;
}

function aplicarFiltros(parametros) {
  const filtros = {};
  const posiblesFiltros = Object.values(TIPOS_FILTROS);

  posiblesFiltros.forEach(filtro => {
    if (parametros[filtro]) {
      filtros[filtro] = parametros[filtro];
    }
  });

  return filtros;
}

async function generarResultadoColeccion(coleccion, cartasUsuario, userId) {
  const resultado = {};
  coleccion.forEach(carta => {
    const cartaUsuario = cartasUsuario.find(cu => cu.carta_id === carta.id);
    if (cartaUsuario) {
      resultado[carta.id] = { disponible: true, cantidad: cartaUsuario.cantidad };
    } else {
      resultado[carta.id] = { disponible: false, cantidad: 0 };
    }
  });
  return resultado;
}

async function usuarioIdValido(userId) {
  const [user] = await db.select().from(user).where(eq(user.id, userId));
  return !!user;
}