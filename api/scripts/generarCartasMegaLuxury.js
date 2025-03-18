import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

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
    console.log('Inicio del proceso de generar cartas Megaluxury ',process.env.CURRENT_API_KEY );

    const response = await fetch('https://adrenalux.duckdns.org/api/v1/mercado/generarCartasMercado', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CURRENT_API_KEY,
      }
    });

    const responseBody = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseBody}`);
    }

    console.log('Cartas Megaluxury generadas exitosamente');
    log('Proceso completado');

  } catch (error) {
    console.error(`Error durante la ejecución: ${error.message}`);
    log(`Error: ${error.message}`);
  }
}

generarCartasMegaluxury();