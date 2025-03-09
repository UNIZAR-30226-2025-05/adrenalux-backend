const fs = require('fs');
const path = require('path');
const { db } = require('./db'); 

// Función para registrar los logs
function log(message) {
  const logFile = path.join(__dirname, '../logs/generarCartas.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

async function generarCartasMegaluxury() {
  try {
    log('Inicio del proceso de generar cartas Megaluxury');

    // Obtenemos las cartas Megaluxury de la base de datos
    const cartasMegaluxury = await db
      .select()
      .from('carta')
      .where('rareza', 2); // 2 es la rareza "Megaluxury"

    if (cartasMegaluxury.length < 3) {
      log('No hay suficientes cartas Megaluxury disponibles');
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
      await db.insert('mercadoDiario').values({
        cartaId: carta.id,
        fechaDisponible: new Date(), // Se hace disponible de inmediato
        precio: 999999, 
      });
      log(`Carta ${carta.id} añadida al mercado diario`);
    }

    log('Proceso de generación de cartas Megaluxury completado');
  } catch (error) {
    log(`Error durante la ejecución: ${error.message}`);
  }
}

generarCartasMegaluxury();
