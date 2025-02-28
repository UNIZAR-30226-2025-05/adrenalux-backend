import { db } from '../config/db.js';
import fs from 'fs';
import path from 'path';

// Ruta del archivo schema.sql
const schemaFilePath = path.join(__dirname, 'schema.sql');

// Función para ejecutar el esquema de la base de datos
async function setupDatabase() {
  const schema = fs.readFileSync(schemaFilePath, 'utf8');
  // Ejecutar el esquema SQL para crear las tablas
  await db.execute(schema);
}

// Configurar la base de datos antes de las pruebas
beforeAll(async () => {
  await setupDatabase(); // Ejecutar el esquema
});

// Limpiar la base de datos después de cada prueba (si es necesario)
afterEach(async () => {
  await db.delete('amistad');
  await db.delete('user');
});

// Asegurarse de que la base de datos esté limpia al final de todas las pruebas
afterAll(async () => {
  await db.delete('amistad');
  await db.delete('user');
});
