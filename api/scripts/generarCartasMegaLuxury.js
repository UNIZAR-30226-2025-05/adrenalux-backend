import fs from 'fs';
import path from 'path';
import {carta} from '../db/schemas/carta.js';
import { mercadoDiario, cartaState } from '../db/schemas/mercado.js';
import { db } from '../config/db.js';
import { eq } from 'drizzle-orm'
import { fileURLToPath } from 'url';
import { TIPOS_CARTAS } from '../config/cartas.config.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(message) {
  const logFile = path.join(__dirname, '../logs/generarCartas.log');
  const logDir = path.dirname(logFile);
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

async function generarCartasMegaluxury() {
  try {
    console.log('Inicio del proceso de generar cartas Megaluxury');

    // Obtenemos las cartas Megaluxury de la base de datos
    const cartasMegaluxury = await db
      .select()
      .from(carta)
      .where(eq(carta.tipo_carta, TIPOS_CARTAS.LUXURYXI.nombre)); 

    if (cartasMegaluxury.length < 3) {
      console.log('No hay suficientes cartas Megaluxury disponibles');
      return;
    }

    // Seleccionar 3 cartas aleatorias
    const cartasAleatorias = [];
    while (cartasAleatorias.length < 3) {
      const cartaAleatoria = cartasMegaluxury[Math.floor(Math.random() * cartasMegaluxury.length)];
      if (!cartasAleatorias.includes(cartaAleatoria)) {
        cartasAleatorias.push(cartaAleatoria);
      }
    }

    // Las añadimos al mercado diario
    for (const carta of cartasAleatorias) {
      await db.insert(mercadoDiario).values({
        cartaId: carta.id,
        fechaDisponible: new Date(), 
        precio: 999999, 
      });
      console.log(`Carta ${carta.id} añadida al mercado diario`);
    }

    log('Proceso de generación de cartas Megaluxury completado');
  } catch (error) {
    console.log(`Error durante la ejecución: ${error.message}`);
  }
}

generarCartasMegaluxury();
