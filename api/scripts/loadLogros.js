// generarLogros.js

import { db } from '../config/db.js'; 
import { logro } from '../db/schemas/logro.js'; 
import { TIPOS_DE_LOGROS } from '../config/logros.config.js';
import { RECOMPENSAS } from '../config/recompensas.config.js'; 

export async function generarLogros(cantidad, tipoLogro, incremento, recompensaTipo, recompensaCantidad) {
  const logros = [];

  for (let i = 1; i <= cantidad; i++) {
    const description = `Logro por ${i * incremento} ${tipoLogro.toLowerCase()}`;
    const requiredAmount = i * incremento;

    logros.push({
      description,
      reward_type: recompensaTipo,
      reward_amount: recompensaCantidad,
      required_type: tipoLogro,
      required_amount: requiredAmount,
    });
  }

  await insertarLogros(logros);
}

async function insertarLogros(logros) {
  if (logros.length > 0) {
    try {
      await db.insert(logro).values(logros);
      console.log('Logros insertados correctamente.');
    } catch (error) {
      console.error('Error al insertar logros:', error.message);
    }
  } else {
    console.log('No hay logros para insertar.');
  }
}

(async () => {
  try {
    await generarLogros(5, TIPOS_DE_LOGROS.PARTIDAS_JUGADAS, 10, 'DINERO', RECOMPENSAS.DINERO.GANAR_PARTIDA);
    await generarLogros(5, TIPOS_DE_LOGROS.SOBRES_ABIERTOS, 5, 'EXPERIENCIA', RECOMPENSAS.EXPERIENCIA.ABRIR_SOBRE);
    await generarLogros(5, TIPOS_DE_LOGROS.CARTAS_CONSEGUIDAS, 50, 'DINERO', RECOMPENSAS.DINERO.SUBIR_NIVEL);
    console.log('Generación de logros completada.');
  } catch (error) {
    console.error('Error en la generación de logros:', error.message);
  }
})();
