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
import { comprobarLogros,aplicarRecompensa } from '../lib/logros.js';
import {
  TIPOS_SOBRES,
  JUGADORES_POR_SOBRE,
  PROBABILIDADES_SOBRES_GRATUITOS,
  PRECIOS_SOBRES,
  PROBABILIDADES_CARTAS,
  TIPOS_CARTAS,
  INTERVALO_SOBRE_GRATIS
} from '../config/cartas.config.js'; 
import { obtenerTodasLasCartas } from './coleccion.js'; 




export async function abrirSobre(req, res, next) {
  const { tipo } = req.params;
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;

  if (!userId) {
    return next(new Unauthorized({ message: 'No autorizado' }));
  }

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
  const cartasOrdenadas = cartas.sort((a, b) => a.tipo_carta - b.tipo_carta);
  const { nuevaXP, nivel,nuevaXPMax } = await agregarExp(userId, RECOMPENSAS.EXPERIENCIA.ABRIR_SOBRE);
  const cartasJson = cartasOrdenadas.map(carta => objectToJson(carta));
  const {logros,recompensas} = await comprobarLogros(userId);

  for (const [tipo, cantidad] of Object.entries(recompensas || {})) {
    await aplicarRecompensa(userId, tipo, cantidad);
  }

  let responseJson = {
    tipo: tipo,
    cartas: cartasJson,
    XP: nuevaXP,
    nivel: nivel,
    xpMax: nuevaXPMax,
    logros: logros ? logros.map(lo => objectToJson(lo)) : [],
    recompensas: recompensas ? recompensas.map(re => objectToJson(re)) : [],
  }
  return sendResponse(req, res, { data: {responseJson} });
}

export async function abrirSobreRandom(req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;
  const tipo = generarTipo();

  const [usuario] = await db.select().from(user).where(eq(user.id, userId));

  if (!tipoSobreDefinido(tipo)) {
    return next(new BadRequest({ message: 'Tipo de sobre no definido' }));
  }

  if (! await tieneSobreGratis(usuario)) {
    return next(new Unauthorized({ message: 'No tienes sobres gratis disponibles' }));
  }
  await restarSobre(usuario);
  const cartas = await generarSobre(tipo);  

  cartas.forEach((carta) => {
    if (carta && carta.id) {
      insertarCartaEnColeccion(carta.id, userId);
    } else {
      console.error('Carta no válida:', carta);
    }
  });
  const cartasOrdenadas = cartas.sort((a, b) => a.tipo_carta - b.tipo_carta);

  const { nuevaXP, nivel,nuevaXPMax } = await agregarExp(userId, RECOMPENSAS.EXPERIENCIA.ABRIR_SOBRE);
  const cartasJson = cartasOrdenadas.map(carta => objectToJson(carta));
  const {logros,recompensas} = await comprobarLogros(userId);

  for (const [tipo, cantidad] of Object.entries(recompensas || {})) {
    await aplicarRecompensa(userId, tipo, cantidad);
  }

  let responseJson = {
    tipo: tipo,
    cartas: cartasJson,
    XP: nuevaXP,
    nivel: nivel,
    xpMax: nuevaXPMax,
    logros: logros ? logros.map(lo => objectToJson(lo)) : [],
    recompensas: recompensas ? recompensas.map(re => objectToJson(re)) : [],
  }
  return sendResponse(req, res, { data: {responseJson} });
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
    const keyA = a.tipo_carta ? a.tipo_carta.toUpperCase() : "NORMAL";
    const keyB = b.tipo_carta ? b.tipo_carta.toUpperCase() : "NORMAL";
    
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

async function tieneSobreGratis(usuario) {

  if (!usuario) return false;
  if (!usuario.ultimoSobre) return true;
  
  const ultimoSobreTime = new Date(usuario.ultimo_sobre_gratis).getTime();
  const horas = INTERVALO_SOBRE_GRATIS * 60 * 60 * 1000; 
  return Date.now() - ultimoSobreTime >= horas;
}

async function restarSobre(usuario) {
  await db.update(user)
    .set({
      ultimo_sobre_gratis: new Date(), 
    })
    .where(eq(user.id, usuario.id));
}


export async function getEquipos(req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;

  if (!userId) {
    return next(new Unauthorized({ message: "No autorizado" }));
  }

  let equipos = await getEquipoUnicos();
  equipos = ordenarAlfabeticamente(equipos);

  return sendResponse(req, res, { data: { equipo: equipos } });
}

export async function getPosiciones(req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;

  if (!userId) {
    return next(new Unauthorized({ message: "No autorizado" }));
  }

  let posiciones = await getPosicionesUnicas();
  posiciones = ordenarAlfabeticamente(posiciones);
  const posicionesFormateadas = formatearLista(posiciones); 

  return sendResponse(req, res, { data: { equipos: posicionesFormateadas } });
}

async function getEquipoUnicos() {
  const cartas = await obtenerTodasLasCartas(); 
  const equiposSet = new Set();

  for (const carta of cartas) {
    equiposSet.add(carta.equipo,carta.escudo);
  }

  return Array.from(equiposSet);
}

async function getPosicionesUnicas() {
  const cartas = await obtenerTodasLasCartas(); 
  const posicionesSet = new Set();

  for (const carta of cartas) {
    posicionesSet.add(carta.posicion);
  }

  return Array.from(posicionesSet);
}

function ordenarAlfabeticamente(array) {
  return array.sort((a, b) => a.localeCompare(b));
}

function formatearLista(lista) {
  return lista.map((item, index) => ({
    id: index + 1,
    nombre: item
  }));
}


export async function getInfoSobres (req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;

  if (!userId) {
    return next(new Unauthorized({ message: "No autorizado" }));
  }
  let jsonInfoSobres = {};

  jsonInfoSobres['SobreGratis'] = {
    intervalo: INTERVALO_SOBRE_GRATIS,  
    probabilidadGratis: PROBABILIDADES_SOBRES_GRATUITOS,  
  };

  for (const tipo in PRECIOS_SOBRES) {
    const infoSobre = PRECIOS_SOBRES[tipo];

    jsonInfoSobres[tipo] = {
      intervalo: INTERVALO_SOBRE_GRATIS,  
      numeroCartas: JUGADORES_POR_SOBRE,  
      precio: infoSobre.precio,  
      probabilidades: PROBABILIDADES_CARTAS[tipo] || "No definido",  
    };
  }
  res.json({ data: jsonInfoSobres });
};


export async function getRarezascartas (req, res, next) {
  const decodedToken = await getDecodedToken(req);
  const userId = decodedToken.id;
  if (!userId) {
    return next(new Unauthorized({ message: "No autorizado" }));
  }
  res.json({ data: TIPOS_CARTAS });
};
