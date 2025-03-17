import { execSync } from 'child_process';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const { DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT } = process.env;

const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  password: DB_PASSWORD,
  port: DB_PORT,
});

async function setupDatabase() {
  try {
    await pool.query(`CREATE DATABASE ${DB_NAME};`);
    console.log(`Base de datos ${DB_NAME} creada.`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`La base de datos ${DB_NAME} ya existe.`);
    } else {
      console.error('Error creando la base de datos:', error);
    }
  } finally {
    await pool.end();
  }

  try {
    execSync('npx drizzle-kit migrate', { stdio: 'inherit' });
    console.log('Migraciones ejecutadas.');
  } catch (error) {
    console.error('Error ejecutando migraciones:', error);
  }
}

setupDatabase();
