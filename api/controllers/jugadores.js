
import { db } from '../config/db.js';
import { sendResponse } from '../lib/http.js';
import { BadRequest } from '../lib/http.js';

// Función para calcular la valoración de una métrica
function calcularValoracion(metrica, peso, maximo) {
  return (metrica * peso) / maximo * 100;
}

// Función para transformar un jugador
export async function transformarJugador(req, res, next) {
  const { jugadorId } = req.body;

  try {
    const [jugador] = await db.select().from('jugadores').where('id', jugadorId);

    if (!jugador) {
      return next(new BadRequest({ message: 'Jugador no encontrado' }));
    }

    // Aquí puedes calcular las valoraciones basadas en las métricas y pesos definidos
    const tipoJugador = jugador.position; // Asume que la posición del jugador está en el campo 'position'
    const metricas = METRICAS_JUGADORES[tipoJugador];

    const valoraciones = {
      ataque: calcularValoracion(jugador.goals, metricas.ataque.goals, 100), // Ejemplo
      medio: calcularValoracion(jugador.successful_passes_opposition_half, metricas.medio.successful_passes_opposition_half, 100), // Ejemplo
      defensa: calcularValoracion(jugador.recoveries, metricas.defensa.recoveries, 100), // Ejemplo
    };

    return sendResponse(req, res, { data: valoraciones });
  } catch (error) {
    return next(error);
  }
}
/*
  // Función para calcular la valoración de una métrica
  function calcularValoracion(metrica, peso, maximo) {
    return (metrica * peso) / maximo * 100;
  }
  
  // Función para calcular la valoración de un delantero
  export function calcularValoracionDelantero(jugador) {
   
    return {
      ataque: valoracionAtaque,
      medio: valoracionMedio,
      defensa: valoracionDefensa,
    };
  }
  
  // Función para calcular la valoración de un mediocampista
  export function calcularValoracionMediocampista(jugador) {

  
    return {
      ataque: valoracionAtaque,
      medio: valoracionMedio,
      defensa: valoracionDefensa,
    };
  }
  
  // Función para calcular la valoración de un defensa
  export function calcularValoracionDefensa(jugador) {

  
    return {
      ataque: valoracionAtaque,
      medio: valoracionMedio,
      defensa: valoracionDefensa,
    };
  }
  
  // Función para calcular la valoración de un portero
  export function calcularValoracionPortero(jugador) {
  
    return {
      ataque: valoracionAtaque,
      medio: valoracionMedio,
      defensa: valoracionDefensa,
    };
  }
    */