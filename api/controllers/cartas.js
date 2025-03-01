import { sendResponse } from '../lib/http.js';
import { Unauthorized, BadRequest } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import {user} from '../db/schemas/user.js';
import {carta} from '../db/schemas/carta.js';
import {coleccion} from '../db/schemas/coleccion.js';
import{restarMonedas} from '../lib/monedas.js';
import{agregarExp, calcularXpNecesaria} from '../lib/exp.js';
import { db } from '../config/db.js'; 
import { objectToJson } from '../lib/toJson.js';
import { eq, and } from 'drizzle-orm'
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

  if (await monedasInsuficientes(tipo, userId)) {
    return next(new Unauthorized({ message: 'Monedas insuficientes' }));
  }
  restarMonedas(userId, PRECIOS_SOBRES[tipo].precio);
  const cartas = await generarSobre(tipo);  

  cartas.forEach((carta) => {
    if (carta && carta.id) {
      insertarCartaEnColeccion(carta.id, userId);
    } else {
      console.error('Carta no válida:', carta);
    }
  });
  const { nuevaXP, nivel,nuevaXPMax } = await agregarExp(userId, RECOMPENSAS.EXPERIENCIA.ABRIR_SOBRE);

  console.log("Xp: ", nuevaXP);
  console.log("nivel: ", nivel);

  const cartasJson = cartas.map(carta => objectToJson(carta));
  let responseJson = {
    tipo: tipo,
    cartas: cartasJson,
    XP: nuevaXP,
    nivel: nivel,
    xpMax: nuevaXPMax
  }
  return sendResponse(req, res, { data: {responseJson} });
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

  cartas.forEach((carta) => {
    insertarCartaEnColeccion(carta.id, userId);
  });
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
  const [existingEntry] = await db.select()
  .from(coleccion)
  .innerJoin(carta, eq(coleccion.carta_id, carta.id))
  .where(and(eq(coleccion.carta_id, cartaId), eq(coleccion.user_id, userId)));

  if (existingEntry && existingEntry.coleccion) {
    await db.update(coleccion)
      .set({ cantidad: existingEntry.coleccion.cantidad + 1 })
      .where(eq(coleccion.id, existingEntry.coleccion.id));
  } else {
    await db.insert(coleccion).values({ carta_id: cartaId, user_id: userId, cantidad: 1 });
  }
}


async function generarSobre(tipo) {
  if (!tipoSobreDefinido(tipo)) {
    throw new Error('Tipo de sobre no definido');
  }
  const sobreConfig = obtenerDatosSobre(tipo);
  const cartasGeneradas = await generarCartas(sobreConfig);

  return cartasGeneradas;
}

async function generarCartas(sobreConfig) {
  const todasLasCartas = await getAllCartas();
  const cartasGeneradas = [];
  const probabilidades = sobreConfig.probabilidades;

  for (let i = 0; i < sobreConfig.cantidadCartas; i++) {
    const rarezaSeleccionada = seleccionarRareza(probabilidades);

    let cartasPosibles = todasLasCartas.filter(carta => carta.rareza === rarezaSeleccionada);

    if (cartasPosibles.length === 0) {
      cartasPosibles = todasLasCartas;
    }

    const cartaSeleccionada = cartasPosibles[Math.floor(Math.random() * cartasPosibles.length)];
    cartasGeneradas.push(cartaSeleccionada);
  }

  cartasGeneradas.sort((a, b) => {
    // Convertimos los valores a mayúsculas y usamos "NORMAL" si es undefined
    const keyA = a.tipo_carta ? a.tipo_carta.toUpperCase() : "NORMAL";
    const keyB = b.tipo_carta ? b.tipo_carta.toUpperCase() : "NORMAL";
    
    // Verificamos que las claves existen en TIPOS_CARTAS, de lo contrario, usamos "NORMAL"
    const tipoA = TIPOS_CARTAS[keyA] ? TIPOS_CARTAS[keyA] : TIPOS_CARTAS["NORMAL"];
    const tipoB = TIPOS_CARTAS[keyB] ? TIPOS_CARTAS[keyB] : TIPOS_CARTAS["NORMAL"];
    
    return tipoA.rareza - tipoB.rareza;
  });
  return cartasGeneradas;
}

async function getAllCartas() {
  const cartas = await db
    .select()
    .from(carta)
    .then(result => result.map(c => ({ ...c })));
  return cartas;
}

function seleccionarRareza(probabilidades) {
  const total = Object.values(probabilidades).reduce((acc, val) => acc + val, 0);
  const rand = Math.random() * total;
  let acumulado = 0;
  for (const key in probabilidades) {
    acumulado += probabilidades[key];
    if (rand < acumulado) {
      return key;
    }
  }
  return "NORMAL"; 
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

