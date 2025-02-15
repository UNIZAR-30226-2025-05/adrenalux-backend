import { sendResponse } from '../lib/http.js';
import { Unauthorized, BadRequest } from '../lib/http.js';

// Tipos de sobres
const TIPOS_SOBRES = {
  ENERGIA_LUX: 'Sobre Energía Lux',
  ELITE_LUX: 'Sobre Elite Lux',
  MASTER_LUX: 'Sobre Master Lux'
};

const JUGADORES_POR_SOBRE = 6;


const PROBABILIDADES_SOBRES_GRATUITOS = {
  [TIPOS_SOBRES.ENERGIA_LUX]: 90,
  [TIPOS_SOBRES.ELITE_LUX]: 8,
  [TIPOS_SOBRES.MASTER_LUX]: 2
};

const TIPOS_FILTROS = {
    POSICION: 'posicion',
    RAREZA: 'rareza',
    EQUIPO: 'equipo'
};

const PRECIOS_SOBRES = {
  [TIPOS_SOBRES.ENERGIA_LUX]: { precio: 750, maximo: 2, intervalo: 6 * 60 * 60 * 1000 },
  [TIPOS_SOBRES.ELITE_LUX]: { precio: 2000, maximo: 1, intervalo: 8 * 60 * 60 * 1000 },
  [TIPOS_SOBRES.MASTER_LUX]: { precio: 6000, maximo: 1, intervalo: 2 * 24 * 60 * 60 * 1000 }
};

const PROBABILIDADES_CARTAS = {
  [TIPOS_SOBRES.ENERGIA_LUX]: { NORMAL: 98, LUXURY: 1.5, MEGALUXURY: 0.49, LUXURYXI: 0.01 },
  [TIPOS_SOBRES.ELITE_LUX]: { NORMAL: 94, LUXURY: 4, MEGALUXURY: 1.5, LUXURYXI: 0.5 },
  [TIPOS_SOBRES.MASTER_LUX]: { NORMAL: 90, LUXURY: 6, MEGALUXURY: 3, LUXURYXI: 1 }
};

// FUnciones de generacion de aperturas de sobres 

export async function abrirSobre(req, res, next) {
  const { tipo,usuarioId } = req.body;

  if (!tipoSobreDefinido(tipo)) {
    return next(new BadRequest({ message: 'Tipo de sobre no definido' }));
  }

  if (monedasInsuficientes(tipo,usuarioId)) {
    return next(new Unauthorized({ message: 'Monedas insuficientes' }));
  }
  const cartas = generarSobre(tipo);
  //añadir las cartas a la bd
  //restar monedas al usuario
  return sendResponse(req, res, { data: { cartas } });
}


export async function abrirSobreRandom(req, res, next) {
 const { usuarioId } = req.body;
  const tipo = generarTipo();

  if (!tipoSobreDefinido(tipo)) {
    return next(new BadRequest({ message: 'Tipo de sobre no definido' }));
  }

  if (!tieneSobreGratis(usuarioId)) {
    return next(new Unauthorized({ message: 'No tienes sobres gratis disponibles' }));
  }
  restarSobre(usuarioId);
  const cartas = generarSobre(tipo);
  //añadir las cartas a la bd 
  return sendResponse(req, res, { data: { tipo, cartas } });
}


function generarSobre(tipo) {
  if (!tipoSobreNodefinido(tipo)) {
    throw new Error('Tipo de sobre no definido');
  }
  const sobreConfig = obtenerDatosSobre(tipo);
  const cartasGeneradas = generarCartas(sobreConfig);

  return cartasGeneradas;
}

// falta de hacer seleccion carta 
function generarCartas(sobreConfig) {
    const cartasGeneradas = [];
    
    while (cartasGeneradas.length < sobreConfig.cantidadCartas) {
        const tipocarta = GenerarTipoCarta(sobreConfig);
        // const carta = seleccionarCarta(tipocarta); funcion que no esta definida 
        // deberemos saber de q id a id iremos los diferentes tipos de cartas 
        if (cartaValida(carta)) {
          cartasGeneradas.push(carta);
        }
    } 
    return cartasGeneradas;
}

function generarTipo() {
    const random = Math.random() * 100;
    if(random < PROBABILIDADES_SOBRES_GRATUITOS[TIPOS_SOBRES.ENERGIA_LUX]){
        return TIPOS_SOBRES.ENERGIA_LUX;
    } else if(random < PROBABILIDADES_SOBRES_GRATUITOS[TIPOS_SOBRES.ELITE_LUX]){
        return TIPOS_SOBRES.ELITE_LUX;
    } else {
        return TIPOS_SOBRES.MASTER_LUX;
    }
  }

function generarTipoCarta(sobreConfig) {
    const random = Math.random() * 100;
    if (random < sobreConfig.probabilidades.ENERGIA_LUX) {
        return 'Energy Lux';
    } else if (random < sobreConfig.probabilidades.ELITE_LUX) {
        return 'Elite Lux';
    } else{
         return 'Master Lux';
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

 function monedasInsuficientes(tipo,usuarioId){
    const monedas = obtenerMonedas(usuarioId);
    const precio = PRECIOS_SOBRES[tipo].precio;

    return monedas < precio;
 }


// funciones de coleccion y eso 

// Función para obtener la colección de un usuario
export async function obtenerColeccion(req, res, next) {  
      const { usuarioId } = req.params;

    if (!usuarioIdValido(usuarioId)) {
        return next(new BadRequest({ message: 'Usuario no válido' }));
    }

    const coleccion = obtenerTodasLasCartas();
    const cartasUsuario = obtenerCartasDeUsuario(usuarioId);
    const resultado = generarResultadoColeccion(coleccion, cartasUsuario);

    return sendResponse(req, res, { data: resultado });
}


export async function filtrarCartas(req, res, next) {
    const parametros = req.query;
    const filtros = aplicarFiltros(parametros);

    const cartasUusario = {};
    const coleccion_filtrada = {};
    const resultado =generarResultadoColeccion(cartasUusario, coleccion_filtrada); ;

    return sendResponse(req, res, { data: resultado });
}

function aplicarFiltros(parametros) {
    const filtros = {};
    const posiblesFiltros = TIPOS_FILTROS;

    posiblesFiltros.forEach(filtro => {
        if (parametros[filtro]) {
            filtros[filtro] = parametros[filtro];
        }
    });

    return filtros;
}

function generarResultadoColeccion(coleccion, cartasUsuario){
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


function getAllCartas(){
  //devolver todas las cartas
}

function devolverColeccionUsuario(usuarioId){
  //devolver la coleccion del usuario con el id especificado
}

function generarCartaAleatoria(tipocarta){
 // depende del tipo de carta que se quiera generar
 // 1. cartas normales 0-500 
 //2 cartas luxury 501-575
 //3 cartas megaluxury 576-600
//4 cartas luxuryxi 600-611
// depende del tipo coger los limites y generar un numero aleatorio entre ellos
// devolver la carta con el id especificado



}

function devolverCarta(idCarta){
  //devolver la carta con el id especificado
}



function tieneSobreGratis(user) {
  // Lógica para verificar si el usuario tiene sobres gratis disponibles
  // Esto puede incluir verificar la última vez que se otorgó un sobre gratuito y cuántos sobres gratuitos tiene el usuario
  return true; // Placeholder
}

function restarSobre(user) {
  // Lógica para restar un sobre gratuito al usuario
  // Esto puede incluir actualizar la base de datos para reflejar que el usuario ha usado un sobre gratuito
}