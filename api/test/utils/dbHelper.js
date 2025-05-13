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
import { TIPOS_CARTAS } from '../../config/cartas.config.js';
import { pbkdf2Sync, randomBytes } from 'crypto';

/**
 * Helper genérico para operaciones CRUD en cualquier tabla
 * @param {import('drizzle-orm').PgTable} table - Esquema de la tabla
 * @returns {Object} Funciones CRUD para la tabla
 */
const createDBHelper = (table, { validateRow } = {}) => ({
  create: async (data) => {
    try {
      const dataArray = Array.isArray(data) ? data : [data];

      for (const row of dataArray) {
        if (validateRow) validateRow(row);
      }

      return await db.insert(table).values(dataArray).returning();
    } catch (error) {
      console.error(`❌ Error creando datos en ${table.tableName}:`, error);
      throw error;
    }
  },

  delete: async (where) => {
    try {
      return await db.delete(table).where(where);
    } catch (error) {
      console.error(`❌ Error eliminando datos de ${table.tableName}:`, error);
      throw error;
    }
  },

  update: async (where, data) => {
    try {
      return await db.update(table).set(data).where(where).returning();
    } catch (error) {
      console.error(`❌ Error actualizando datos en ${table.tableName}:`, error);
      throw error;
    }
  },

  find: async (where = {}) => {
    try {
      return await db.select().from(table).where(where);
    } catch (error) {
      console.error(`❌ Error buscando datos en ${table.tableName}:`, error);
      throw error;
    }
  },

  findOne: async (where = {}) => {
    try {
      const results = await db.select().from(table).where(where).limit(1);
      return results[0];
    } catch (error) {
      console.error(`❌ Error buscando un dato en ${table.tableName}:`, error);
      throw error;
    }
  },

  clear: async () => {
    try {
      await db.delete(table);
    } catch (error) {
      console.error(`❌ Error limpiando tabla ${table.tableName}:`, error);
      throw error;
    }
  },

  count: async () => {
    const result = await db.select({ count: sql`COUNT(*)` }).from(table);
    return parseInt(result[0].count);
  },

  exists: async (where) => {
    const result = await db.select().from(table).where(where).limit(1);
    return result.length > 0;
  },


  withTransaction: async (callback) => {
    try {
      return await db.transaction(async (tx) => {
        const txHelper = {
          ...createDBHelper(table, { validateRow }),
          db: tx
        };
        return await callback(txHelper);
      });
    } catch (error) {
      console.error(`❌ Error durante transacción en ${table.tableName}:`, error);
      throw error;
    }
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
    await tx.delete(carta_plantilla);
    await tx.delete(mercadoCartas);
    await tx.delete(mercadoDiario);
    await tx.delete(coleccion);
    await tx.delete(logro);
    await tx.delete(participacionTorneo);
    await tx.delete(partida); 
    await tx.delete(amistad);
    await tx.delete(torneo);
    await tx.update(user).set({ plantilla_activa_id: null });
    await tx.delete(plantilla); 
    await tx.delete(carta);
    await tx.delete(user);
  });
};

const HASH_CONFIG = {
  iterations: 100000,
  keyLength: 64,
  digest: 'sha512'
};

export const seedTestData = async () => {
  const passwordPlano = '123456';
  const salt = randomBytes(16).toString('hex');
  const hashedPassword = pbkdf2Sync(passwordPlano, salt, HASH_CONFIG.iterations, HASH_CONFIG.keyLength, HASH_CONFIG.digest).toString('hex');

  const [user1, user2, user3] = await userHelper.create([
    {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      salt: salt,
      friend_code: 'ABC123',
      adrenacoins: 10700,
      name: 'Admin',
      lastname: 'User',
      puntosClasificacion: 100,
      ultimo_sobre_gratis: null,
    },
    {
      username: 'test1',
      email: 'test1@example.com',
      password: hashedPassword,
      salt: salt,
      friend_code: 'DEF456',
      name: 'Test',
      lastname: 'One',
      puntosClasificacion: 150,
      ultimo_sobre_gratis: null,
    },
    {
      username: 'test2',
      email: 'test2@example.com',
      password: hashedPassword,
      salt: salt,
      friend_code: 'GHI789',
      name: 'Test',
      lastname: 'Two',
      puntosClasificacion: 50,
      ultimo_sobre_gratis: null,
    },
  ]);

  await amistadHelper.create([
    { user1_id: user1.id, user2_id: user2.id, estado: 'aceptada' },
    { user1_id: user2.id, user2_id: user1.id, estado: 'aceptada' },
    { user1_id: user1.id, user2_id: user3.id, estado: 'aceptada' },
    { user1_id: user3.id, user2_id: user1.id, estado: 'aceptada' },
    { user1_id: user2.id, user2_id: user3.id, estado: 'aceptada' },
    { user1_id: user3.id, user2_id: user2.id, estado: 'aceptada' },
  ]);

  const [plantilla1, plantilla2, plantilla3] = await plantillaHelper.create([
    { user_id: user1.id, nombre: 'Plantilla 1' },
    { user_id: user2.id, nombre: 'Plantilla 2' },
    { user_id: user3.id, nombre: 'Plantilla 3' },
  ]);

  await userHelper.update(eq(user.id, user1.id), { plantilla_activa_id: plantilla1.id });
  await userHelper.update(eq(user.id, user2.id), { plantilla_activa_id: plantilla2.id });
  await userHelper.update(eq(user.id, user3.id), { plantilla_activa_id: plantilla3.id });

  await partidaHelper.create([
    {
      turno: 1,
      user1_id: user1.id,
      user2_id: user2.id,
      ganador_id: user1.id,
      plantilla1_id: plantilla1.id,
      plantilla2_id: plantilla2.id,
      estado: 'finalizada',
      puntuacion1: 1,
      puntuacion2: 0,
    },
    {
      turno: 2,
      user1_id: user2.id,
      user2_id: user3.id,
      ganador_id: user2.id,
      plantilla1_id: plantilla2.id,
      plantilla2_id: plantilla3.id,
      estado: 'finalizada',
      puntuacion1: 0,
      puntuacion2: 1,
    },
    {
      turno: 3,
      user1_id: user1.id,
      user2_id: user3.id,
      ganador_id: user1.id,
      plantilla1_id: plantilla1.id,
      plantilla2_id: plantilla3.id,
      estado: 'finalizada',
      puntuacion1: 2,
      puntuacion2: 1,
    },
  ]);

  const [torneo1, torneo2, torneo3] = await torneoHelper.create([
    {
      nombre: 'Torneo Admin vs Test1',
      contrasena: null,
      ganador_id: null,
      premio: 1000,
      descripcion: 'Competencia entre Admin y Test1',
      fecha_inicio: new Date().toISOString(),
      torneo_en_curso: true,
      creador_id: user1.id,
    },
    {
      nombre: 'Torneo Test1 vs Test2',
      contrasena: null,
      ganador_id: null,
      premio: 1000,
      descripcion: 'Competencia entre Test1 y Test2',
      fecha_inicio: new Date().toISOString(),
      torneo_en_curso: true,
      creador_id: user2.id,
    },
    {
      nombre: 'Torneo Admin vs Test2',
      contrasena: null,
      ganador_id: null,
      premio: 1000,
      descripcion: 'Competencia entre Admin y Test2',
      fecha_inicio: new Date().toISOString(),
      torneo_en_curso: true,
      creador_id: user3.id,
    },
  ]);

  await participacionTorneoHelper.create([
    { user_id: user1.id, torneo_id: torneo1.id },
    { user_id: user2.id, torneo_id: torneo1.id },
    { user_id: user1.id, torneo_id: torneo2.id },
    { user_id: user3.id, torneo_id: torneo2.id },
    { user_id: user3.id, torneo_id: torneo3.id },
  ]);

  const cartas = await cartaHelper.create([
    {
      nombre: 'Robert Lewandowski',
      alias: 'Robert Lewandowski',
      posicion: 'Delantero',
      equipo: 'FC Barcelona',
      tipo_carta: TIPOS_CARTAS.NORMAL.nombre,
      escudo: 'https://example.com/escudo.png',
      pais: 'Polonia',
      photo: 'https://example.com/photo.png',
      defensa: 50,
      control: 80,
      ataque: 90,
    },
    {
      nombre: 'Jude Bellingham',
      alias: 'Jude Bellingham',
      posicion: 'Centrocampista',
      equipo: 'Real Madrid',
      tipo_carta: TIPOS_CARTAS.LUXURYXI.nombre,
      escudo: 'https://example.com/escudo.png',
      pais: 'Inglaterra',
      photo: 'https://example.com/photo.png',
      defensa: 70,
      control: 80,
      ataque: 80,
    },
    {
      nombre: 'Jan Oblak',
      alias: 'Jan Oblak',
      posicion: 'Portero',
      equipo: 'Atlético de Madrid',
      tipo_carta: TIPOS_CARTAS.NORMAL.nombre,
      escudo: 'https://example.com/escudo.png',
      pais: 'Eslovenia',
      photo: 'https://example.com/photo.png',
      defensa: 90,
      control: 30,
      ataque: 30,
    },

    {
      nombre: 'Antoine Griezmann',
      alias: 'Antoine Griezmann',
      posicion: 'Delantero',
      equipo: 'Atlético de Madrid',
      tipo_carta: TIPOS_CARTAS.LUXURYXI.nombre,
      escudo: 'https://example.com/escudo.png',
      pais: 'Francia',
      photo: 'https://example.com/photo.png',
      defensa: 30,
      control: 75,
      ataque: 90,
    },

    {
      nombre: 'Pedri',
      alias: 'Pedri',
      posicion: 'Centrocampista',
      equipo: 'FC Barcelona',
      tipo_carta: TIPOS_CARTAS.LUXURYXI.nombre,
      escudo: 'https://example.com/escudo.png',
      pais: 'España',
      photo: 'https://example.com/photo.png',
      defensa: 60,
      control: 90,
      ataque: 75,
    },

    {
      nombre: 'Kylian Mbappe',
      alias: 'Kylian Mbappe',
      posicion: 'Delantero',
      equipo: 'Real Madrid',
      tipo_carta: TIPOS_CARTAS.LUXURYXI.nombre,
      escudo: 'https://example.com/escudo.png',
      pais: 'Francia',
      photo: 'https://example.com/photo.png',
      defensa: 30,
      control: 75,
      ataque: 90,
    },
  ]);

  await coleccionHelper.create([
    { user_id: user1.id, carta_id: cartas[0].id },
    { user_id: user1.id, carta_id: cartas[1].id },
    { user_id: user1.id, carta_id: cartas[2].id },
    { user_id: user2.id, carta_id: cartas[0].id },
    { user_id: user2.id, carta_id: cartas[1].id },
    { user_id: user2.id, carta_id: cartas[2].id },
    { user_id: user3.id, carta_id: cartas[0].id },
    { user_id: user3.id, carta_id: cartas[1].id },
    { user_id: user3.id, carta_id: cartas[2].id },
    { user_id: user1.id, carta_id: cartas[3].id },
    { user_id: user1.id, carta_id: cartas[4].id },
    { user_id: user1.id, carta_id: cartas[5].id },
    { user_id: user2.id, carta_id: cartas[3].id },
    { user_id: user2.id, carta_id: cartas[4].id },
    { user_id: user2.id, carta_id: cartas[5].id },
    { user_id: user3.id, carta_id: cartas[3].id },
    { user_id: user3.id, carta_id: cartas[4].id },
    { user_id: user3.id, carta_id: cartas[5].id },
  ]);

  return { user1, user2, user3, cartas };
};



export const getAuthToken = async ({ email, password }) => {

  const response = await request(app)
    .post('/api/v1/auth/sign-in')
    .set('x-api-key', process.env.CURRENT_API_KEY)
    .send({ email, password });

  if (response.status !== 200) {
    console.error('❌ Error al hacer login');
    console.error('Detalles:', {
      email,
      password,
      status: response.status,
      responseBody: response.body
    });
    throw new Error(`No se pudo obtener el token. Status: ${response.status}`);
  }

  if (!response.body?.data?.token) {
    console.error('❌ Token no encontrado en la respuesta');
    console.error('Detalles:', {
      responseBody: response.body
    });
    throw new Error('No se encontró el token en la respuesta de login');
  }

  return response.body.data.token;
};


