// generarLogros.js

import { db } from '../config/db.js'; 
import { logro } from '../db/schemas/logro.js'; 
import { DESCRIPCION_LOGROS, TIPOS_DE_LOGROS } from '../config/logros.config.js';
import { RECOMPENSAS } from '../config/recompensas.config.js'; 

export async function generarLogros(cantidad, tipoLogro, descripcion, incremento, recompensaTipo, recompensaCantidad) {
  const logros = [];
  console.log("Incremento: ", incremento);
  for (let i = 1; i <= cantidad; i++) {
    const description = `Logro por ${i * incremento} ${descripcion.toLowerCase()}`;
    const requiredAmount = i * incremento;
    console.log("Required: ", requiredAmount);
    logros.push({
      description,
      reward_type: recompensaTipo,
      reward_amount: recompensaCantidad,
      logro_type: tipoLogro,
      requirement: requiredAmount,
    });
  }

  await insertarLogros(logros);
}

async function insertarLogros(logros) {
  if (logros.length > 0) {
    for(const achievement of logros) {
      try {
        await db.insert(logro).values(achievement);
        console.log('Logros insertados correctamente.');
      } catch (error) {
        console.error('Error al insertar logros:', error.message);
      }
    }
    
  } else {
    console.log('No hay logros para insertar.');
  }
}

(async () => {
  try {
    await generarLogros(5, TIPOS_DE_LOGROS.PARTIDAS_JUGADAS, DESCRIPCION_LOGROS.PARTIDAS_JUGADAS, 10, 'XP', RECOMPENSAS.EXPERIENCIA.PERDER_PARTIDA);
    await generarLogros(5, TIPOS_DE_LOGROS.PARTIDAS_GANADAS, DESCRIPCION_LOGROS.PARTIDAS_GANADAS, 5, 'DINERO', RECOMPENSAS.DINERO.GANAR_PARTIDA);
    await generarLogros(5, TIPOS_DE_LOGROS.CARTAS_CONSEGUIDAS,  DESCRIPCION_LOGROS.CARTAS_CONSEGUIDAS, 50, 'XP', RECOMPENSAS.EXPERIENCIA.CARTAS_CONSEGUIDAS);
    await generarLogros(5, TIPOS_DE_LOGROS.NIVEL_ALCANZADO,  DESCRIPCION_LOGROS.NIVEL_ALCANZADO, 5, 'DINERO', RECOMPENSAS.DINERO.SUBIR_NIVEL);
    console.log('Generación de logros completada.');
  } catch (error) {
    console.error('Error en la generación de logros:', error.message);
  }
})();
