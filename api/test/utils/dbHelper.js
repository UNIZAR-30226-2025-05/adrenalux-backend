import { db } from '../../config/db.js';
import { eq } from 'drizzle-orm';
import {
  user,
  amistad,
  partida,
  carta,
  torneo,
  participacionTorneo,
  coleccion,
  logro,
  carta_plantilla,
  mercado,
  plantilla
} from '../../db/schemas';

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
export const mercadoHelper = createDBHelper(mercado);
export const plantillaHelper = createDBHelper(plantilla);

export const clearAllTables = async () => {
  await db.transaction(async (tx) => {
    await tx.delete(plantilla);
    await tx.delete(carta_plantilla);
    await tx.delete(mercado);
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

export const seedTestData = async () => {
  const [ testUser] = await userHelper.create([
    {
      username: 'admin',
      email: 'admin@example.com',
      password: 'hashed_password',
      salt: 'salt123'
    },
  ]);

  return { testUser };
};