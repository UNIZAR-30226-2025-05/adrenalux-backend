import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Para __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadFixtures() {
  try {
    const filePath = path.join(__dirname, 'testData.json');
    const rawData = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(rawData);

    console.log('📄 Datos cargados:', data);
  } catch (error) {
    console.error('❌ Error al leer JSON:', error);
  }
}

loadFixtures();
