import { sendResponse } from '../lib/http.js';
import { Unauthorized, BadRequest } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import fs from 'fs';
import path from 'path';

import {
  TIPOS_SOBRES,
  JUGADORES_POR_SOBRE,
  PROBABILIDADES_SOBRES_GRATUITOS,
  TIPOS_FILTROS,
  PRECIOS_SOBRES,
  PROBABILIDADES_CARTAS
} from '../config/cartas.config.js'; 

// Funciones de generación de aperturas de sobres

export async function abrirSobre(req, res, next) {
  const { tipo } = req.body;
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;

  if (!tipoSobreDefinido(tipo)) {
    return next(new BadRequest({ message: 'Tipo de sobre no definido' }));
  }

  if (monedasInsuficientes(tipo, userId)) {
    return next(new Unauthorized({ message: 'Monedas insuficientes' }));
  }
  const cartas = generarSobre(tipo);
  // Añadir las cartas a la base de datos
  // Restar monedas al usuario
  return sendResponse(req, res, { data: { cartas } });
}

export async function abrirSobreRandom(req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;
  const tipo = generarTipo();

  if (!tipoSobreDefinido(tipo)) {
    return next(new BadRequest({ message: 'Tipo de sobre no definido' }));
  }

  if (!tieneSobreGratis(userId)) {
    return next(new Unauthorized({ message: 'No tienes sobres gratis disponibles' }));
  }
  restarSobre(userId);
  const cartas = generarSobre(tipo);
  // Añadir las cartas a la base de datos 
  return sendResponse(req, res, { data: { tipo, cartas } });
}

function generarSobre(tipo) {
  if (!tipoSobreDefinido(tipo)) {
    throw new Error('Tipo de sobre no definido');
  }
  const sobreConfig = obtenerDatosSobre(tipo);
  const cartasGeneradas = generarCartas(sobreConfig);

  return cartasGeneradas;
}

function generarCartas(sobreConfig) {
  const cartasGeneradas = [];
  
  while (cartasGeneradas.length < sobreConfig.cantidadCartas) {
    const tipoCarta = generarTipoCarta(sobreConfig);
    // const carta = seleccionarCarta(tipoCarta); función no definida
    // Necesitamos definir cómo seleccionar las cartas aquí
    if (cartaValida(carta)) {
      cartasGeneradas.push(carta);
    }
  }
  return cartasGeneradas;
}

function generarTipo() {
  const random = Math.random() * 100;
  if (random < PROBABILIDADES_SOBRES_GRATUITOS[TIPOS_SOBRES.ENERGIA_LUX]) {
    return TIPOS_SOBRES.ENERGIA_LUX;
  } else if (random < PROBABILIDADES_SOBRES_GRATUITOS[TIPOS_SOBRES.ELITE_LUX]) {
    return TIPOS_SOBRES.ELITE_LUX;
  } else {
    return TIPOS_SOBRES.MASTER_LUX;
  }
}

function generarTipoCarta(sobreConfig) {
  const random = Math.random() * 100;
  if (random < sobreConfig.probabilidades.ENERGIA_LUX) {
    return TIPOS_SOBRES.ENERGIA_LUX;
  } else if (random < sobreConfig.probabilidades.ELITE_LUX) {
    return TIPOS_SOBRES.ELITE_LUX;
  } else {
    return TIPOS_SOBRES.MASTER_LUX;
  }
}

function tipoSobreDefinido(tipo) {
  return Object.values(TIPOS_SOBRES).includes(tipo);
}

function obtenerDatosSobre(tipo) {
  return {
    cantidadCartas: JUGADORES_POR_SOBRE,
    probabilidades: PROBABILIDADES_CARTAS[tipo],
    PRECIOS_SOBRES: PRECIOS_SOBRES[tipo],
  };
}

function monedasInsuficientes(tipo, usuarioId) {
  const monedas = obtenerMonedas(usuarioId);
  const precio = PRECIOS_SOBRES[tipo].precio;

  return monedas < precio;
}


export async function sobresDisponibles(req, res, next) {
  const sobresDir = path.join(process.cwd(), 'api/images/sobres');
  console.log(`📂 Intentando leer la carpeta: ${sobresDir}`);
  fs.readdir(sobresDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Error al leer la carpeta de sobres" });
    }

    const sobres = files
      .filter(file => /\.(png|jpg|jpeg|gif)$/i.test(file)) // Filtrar solo imágenes
      .map(file => {
        const filePath = path.join(sobresDir, file);
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');
        return {
          filename: file,
          image: `data:image/png;base64,${base64Image}` // Ajusta el tipo según el formato de imagen
        };
      });

    res.json(sobres);
  });
}


function tieneSobreGratis(usuario) {
  // Lógica para verificar si el usuario tiene sobres gratis disponibles
}

function restarSobre(usuario) {
  // Lógica para restar un sobre gratuito al usuario
}

