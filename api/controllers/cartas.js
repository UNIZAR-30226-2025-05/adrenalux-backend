import { sendResponse } from '../lib/http.js';
import { Unauthorized, BadRequest } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import {user} from '../db/schemas/user.js';
import {coleccion} from '../db/schemas/coleccion.js';
import{restarMonedas} from '../lib/monedas.js';
import{agregarExp} from '../lib/exp.js';
import { db } from '../config/db.js'; 
import { eq } from 'drizzle-orm'
import { RECOMPENSAS } from '../config/recompensas.config.js';
import {
  TIPOS_SOBRES,
  JUGADORES_POR_SOBRE,
  PROBABILIDADES_SOBRES_GRATUITOS,
  PRECIOS_SOBRES,
  PROBABILIDADES_CARTAS,
  TIPOS_CARTAS
} from '../config/cartas.config.js'; 

// Funciones de generación de aperturas de sobres

export async function abrirSobre(req, res, next) {
  const { tipo } = req.params;
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;

  if (!tipoSobreDefinido(tipo)) {
    return next(new BadRequest({ message: 'Tipo de sobre no definido' }));
  }

  if (monedasInsuficientes(tipo, userId)) {
    return next(new Unauthorized({ message: 'Monedas insuficientes' }));
  }
  restarMonedas(tipo, userId);
  const cartas = generarSobre(tipo);
  insertarCartaEnColeccion(cartaId, userId);
  nuevaXP,nivel = agregarExp(userId,RECOMPENSAS.ABRIR_SOBRE_EXP);

  const cartasJson = cartas.map(carta => objectToJson(carta));

  responeJson = {
    tipo: tipo,
    cartas: cartasJson,
    XP: nuevaXP,
    nivel: nivel
  }
  return sendResponse(req, res, { data: {responeJson} });
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
  insertarCartaEnColeccion(cartaId, userId);
  nuevaXP,nivel = agregarExp(userId,RECOMPENSAS.ABRIR_SOBRE_EXP);

  const cartasJson = cartas.map(carta => objectToJson(carta));

  responeJson = {
    tipo: tipo,
    cartas: cartasJson,
    XP: nuevaXP,
    nivel: nivel
  }
  return sendResponse(req, res, { data: {responeJson} });
}

async function insertarCartaEnColeccion(cartaId, userId) {
  const [existingEntry] = await db.select().from(coleccion).where(and(eq(coleccion.carta_id, cartaId), eq(coleccion.user_id, userId)));

  if (existingEntry) {
    await db.update(coleccion).set({ cantidad: existingEntry.cantidad + 1 }).where(eq(coleccion.id, existingEntry.id));
  } else {
    await db.insert(coleccion).values({ carta_id: cartaId, user_id: userId, cantidad: 1 });
  }
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
     const carta = generarCarta(tipoCarta);
    // Necesitamos definir cómo seleccionar las cartas aquí
    if (cartaValida(carta,tipoCarta)) {
      cartasGeneradas.push(carta);
    }
  }
  return cartasGeneradas;
}

function generarCarta(tipo) {
  MIN = tipo.MIN_ID 
  MAX = tipo.MAX_ID
  idcarta =  Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
  return getCarta(idcarta);

}

async function getCarta(id) {
  const [carta] = await db.select().from(carta).where(eq(carta.id, id));
  return carta;
}

async function cartaValida(carta, tipoCarta) {
  try {
    const [existe] = await db
      .select()
      .from(coleccion)
      .where(and((coleccion.carta_id, carta.id), eq(coleccion.tipo, tipoCarta)));
    return !!existe;
  } catch (error) {
    console.error('Error al validar la carta:', error);
    return false; // En caso de error, devuelve false
  }
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
    return TIPOS_CARTAS.NORMAL;
  } else if (random < sobreConfig.probabilidades.ELITE_LUX) {
    return TIPOS_CARTAS.LUXURY;
  } else {
    return TIPOS_CARTAS.MEGALUXURY;
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

async function monedasInsuficientes(tipo, usuarioId) {
  const [usuario] = await db.select().from(user).where(eq(user.id, usuarioId));
  return usuario.adrenacoins < PRECIOS_SOBRES[tipo].precio;
}


export async function sobresDisponibles(req, res, next) {
    try {
        const basePath = '/public/images/sobres/';
        
        const sobres = Object.keys(TIPOS_SOBRES).map(key => {
            const tipo = TIPOS_SOBRES[key];
            return {
                tipo,
                imagen: `${basePath}${tipo.toLowerCase().replace(/\s+/g, '_')}.png`,
                precio: PRECIOS_SOBRES[tipo]?.precio || 0
            };
        });
        
        res.json(sobres);
    } catch (error) {
        next(error);
    }
}


function tieneSobreGratis(usuario) {
  // Lógica para verificar si el usuario tiene sobres gratis disponibles
}

function restarSobre(usuario) {
  // Lógica para restar un sobre gratuito al usuario
}

