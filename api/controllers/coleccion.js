import { sendResponse } from '../lib/http.js';
import { Unauthorized, BadRequest } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import fs from 'fs';
import path from 'path';

import {
  TIPOS_FILTROS,
} from '../config/cartas.config.js'; 



export async function obtenerColeccion(req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;

  if (!usuarioIdValido(userId)) {
    return next(new BadRequest({ message: 'Usuario no válido' }));
  }

  const coleccion = obtenerTodasLasCartas();
  const cartasUsuario = obtenerCartasDeUsuario(userId);
  const resultado = generarResultadoColeccion(coleccion, cartasUsuario);

  return sendResponse(req, res, { data: resultado });
}

export async function filtrarCartas(req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;
  const parametros = req.query;
  const filtros = aplicarFiltros(parametros);

  const cartasUsuario = {}; //aplicar filtros
  const coleccionFiltrada = {}; //aplicar filtros
  const resultado = generarResultadoColeccion(cartasUsuario, coleccionFiltrada);

  return sendResponse(req, res, { data: resultado });
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

function generarResultadoColeccion(coleccion, cartasUsuario) {
  const resultado = {};
  coleccion.forEach(carta => {
    if (cartasUsuario.includes(carta.id)) {
      resultado[carta.id] = { disponible: true, cantidad: obtenerCantidadCarta(usuarioId, carta.id) };
    } else {
      resultado[carta.id] = { disponible: false, cantidad: 0 };
    }
  });
  return resultado;
}
