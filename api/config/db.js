import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';

// Cargar las variables de entorno desde .env.test si estamos en un entorno de pruebas
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();  // Cargar el .env por defecto para producción
}

// Configura la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Crea la instancia de Drizzle ORM
export const db = drizzle(pool);
