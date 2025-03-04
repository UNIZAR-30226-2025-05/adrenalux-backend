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
import {TIPOS_FILTROS,} from '../config/cartas.config.js';

export async function obtenerColeccion(req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;

  if (!await usuarioIdValido(userId)) {
    return next(new BadRequest({ message: 'Usuario no válido' }));
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
  const resultado = await generarResultadoColeccion(coleccionFiltrada, cartasUsuario, userId);

  return sendResponse(req, res, { data: resultado });
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
  coleccion.forEach(carta => {

    const cartaUsuario = cartasUsuario.find(cu => cu.carta_id === carta.id);

    if (cartaUsuario) {
      resultado.push({
        ...carta, 
        disponible: true,
        cantidad: cartaUsuario.cantidad,
      });
    } else {
      resultado.push({
        ...carta, 
        disponible: false,
        cantidad: 0,
      });
    }
  });

  return resultado;
}


async function usuarioIdValido(userId) {
  const [usuario] = await db.select().from(user).where(eq(user.id, userId));
  return !!usuario;
}
