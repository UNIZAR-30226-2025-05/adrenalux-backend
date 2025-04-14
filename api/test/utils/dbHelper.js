import { db } from '../../config/db.js';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { app } from '../../app.js';
import { user } from '../../db/schemas/user.js';
import { amistad } from '../../db/schemas/amistad.js';
import { partida } from '../../db/schemas/partida.js';
import { carta } from '../../db/schemas/carta.js';
import { torneo } from '../../db/schemas/torneo.js';
import { participacionTorneo } from '../../db/schemas/participacionTorneo.js';
import { coleccion } from '../../db/schemas/coleccion.js';
import { logro } from '../../db/schemas/logro.js';
import { carta_plantilla } from '../../db/schemas/carta_plantilla.js';
import { mercadoCartas } from '../../db/schemas/mercado.js';
import { mercadoDiario } from '../../db/schemas/mercado.js';
import { plantilla } from '../../db/schemas/plantilla.js';
import bcrypt from 'bcrypt';

/**
 * Helper genérico para operaciones CRUD en cualquier tabla
 * @param {import('drizzle-orm').PgTable} table - Esquema de la tabla
 * @returns {Object} Funciones CRUD para la tabla
 */
const createDBHelper = (table) => ({
  create: async (data) => {
    const dataArray = Array.isArray(data) ? data : [data];
    return await db.insert(table).values(dataArray).returning();
  },

  delete: async (where) => {
    await db.delete(table).where(where);
  },

  update: async (where, data) => {
    return await db.update(table).set(data).where(where).returning();
  },

  find: async (where) => {
    return await db.select().from(table).where(where);
  },

  findOne: async (where) => {
    const results = await db.select().from(table).where(where).limit(1);
    return results[0];
  },

  clear: async () => {
    await db.delete(table);
  },

  // Función especial para transacciones
  withTransaction: async (callback) => {
    return await db.transaction(async (tx) => {
      const txHelper = {
        ...createDBHelper(table),
        db: tx // Sobreescribimos db para usar la transacción
      };
      return await callback(txHelper);
    });
  }
});

export const userHelper = createDBHelper(user);
export const amistadHelper = createDBHelper(amistad);
export const partidaHelper = createDBHelper(partida);
export const cartaHelper = createDBHelper(carta);
export const torneoHelper = createDBHelper(torneo);
export const participacionTorneoHelper = createDBHelper(participacionTorneo);
export const coleccionHelper = createDBHelper(coleccion);
export const logroHelper = createDBHelper(logro);
export const cartaPlantillaHelper = createDBHelper(carta_plantilla);
export const mercadoCartasHelper = createDBHelper(mercadoCartas);
export const mercadoDiarioHelper = createDBHelper(mercadoDiario);
export const plantillaHelper = createDBHelper(plantilla);

export const clearAllTables = async () => {
  await db.transaction(async (tx) => {
    await tx.delete(plantilla);
    await tx.delete(carta_plantilla);
    await tx.delete(mercadoCartas);
    await tx.delete(mercadoDiario);
    await tx.delete(coleccion);
    await tx.delete(logro);
    await tx.delete(participacionTorneo);
    await tx.delete(partida);
    await tx.delete(amistad);
    await tx.delete(torneo);
    await tx.delete(carta);
    await tx.delete(user);
  });
};

export function generateDummyFriendCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 caracteres
}

export const seedTestData = async () => {
  const [ testUser ] = await userHelper.create([
    {
      username: 'admin',
      email: 'admin@example.com',
      password: 'hashed_password',
      salt: 'salt123',
      friend_code: generateDummyFriendCode(),
      name: 'Admin',
      lastname: 'User',
    },
  ]);

  return { testUser };
};

export const getAuthToken = async () => {
  const testUserData = {
    username: 'testUser',
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test',
    lastname: 'User',
    friend_code: generateDummyFriendCode(),
  };

  // Buscar usuario por email
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, testUserData.email))
    .limit(1);

  // Si no existe, lo creamos
  if (existingUser.length === 0) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUserData.password, salt);

    await db.insert(user).values({
      ...testUserData,
      password: hashedPassword,
      salt: salt,
    });
  }

  // Login para obtener el token
  const response = await request(app)
    .post('/api/v1/auth/login')
    .set('x-api-key', process.env.CURRENT_API_KEY)
    .send({
      email: testUserData.email,
      password: testUserData.password,
    });

  return response.body.token;
};
