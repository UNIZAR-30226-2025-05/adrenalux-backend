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
    
    for (const row of dataArray) {
      if ('plantilla2_id' in row && (row.plantilla2_id === undefined || row.plantilla2_id === null)) {
        console.error('❌ Error: plantilla2_id inválido en partida:', row);
        throw new Error('plantilla2_id inválido');
      }
    }
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
    await tx.delete(carta_plantilla);
    await tx.delete(mercadoCartas);
    await tx.delete(mercadoDiario);
    await tx.delete(coleccion);
    await tx.delete(logro);
    await tx.delete(participacionTorneo);
    await tx.delete(partida); 
    await tx.delete(amistad);
    await tx.delete(torneo);
    await tx.delete(plantilla); 
    await tx.delete(carta);
    await tx.delete(user);
  });
};

export function generateDummyFriendCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 caracteres
}

export const seedTestData = async () => {
  const [user1, user2, user3] = await userHelper.create([
    {
      username: 'admin',
      email: 'admin@example.com',
      password: 'hashed_password',
      salt: 'salt123',
      friend_code: generateDummyFriendCode(),
      name: 'Admin',
      lastname: 'User',
      puntosClasificacion: 100,
    },
    {
      username: 'test1',
      email: 'test1@example.com',
      password: 'hashed_password',
      salt: 'salt123',
      friend_code: generateDummyFriendCode(),
      name: 'Test',
      lastname: 'One',
      puntosClasificacion: 150,
    },
    {
      username: 'test2',
      email: 'test2@example.com',
      password: 'hashed_password',
      salt: 'salt123',
      friend_code: generateDummyFriendCode(),
      name: 'Test',
      lastname: 'Two',
      puntosClasificacion: 50,
    },
  ]);

  const plantillas = await plantillaHelper.create([
    {
      user_id: user1.id,
      nombre: 'Plantilla 1',
    },
    {
      user_id: user2.id,
      nombre: 'Plantilla 2',
    },
    {
      user_id: user3.id,
      nombre: 'Plantilla 3',
    },
  ]);

  const checkPlantillas = await db.select().from(plantilla);
  console.log('Plantillas en la base de datos:', checkPlantillas);
  
  const updateData = { plantilla_activa_id: plantillas[0].id };
  console.log("Actualizando usuario con datos:", updateData);
  
  await userHelper.update(user1.id, { plantilla_activa_id: plantillas[0].id });
  await userHelper.update(user2.id, { plantilla_activa_id: plantillas[1].id });
  await userHelper.update(user3.id, { plantilla_activa_id: plantillas[2].id });

  console.log('Plantillas creadas:', plantillas);
  console.log('Creando partida con:', {
    user1: user1.id,
    user2: user2.id,
    plantilla1: plantillas[0].id,
    plantilla2: plantillas[1].id,
  });
  
  console.log("Insertando partidas:", [
  {
    turno: 1,
    user1_id: user1.id,
    user2_id: user2.id,
    ganador_id: user1.id,
    plantilla1_id: plantillas[0]?.id,
    plantilla2_id: plantillas[1]?.id,
  },
  {
    turno: 2,
    user1_id: user2.id,
    user2_id: user3.id,
    ganador_id: user2.id,
    plantilla1_id: plantillas[1]?.id,
    plantilla2_id: plantillas[2]?.id,
  },
  {
    turno: 3,
    user1_id: user1.id,
    user2_id: user3.id,
    ganador_id: user1.id,
    plantilla1_id: plantillas[0]?.id,
    plantilla2_id: plantillas[2]?.id,
  },
]);

  // Creamos partidas ficticias para que tengan stats
  await partidaHelper.create([
    {
      turno: 1,
      user1_id: user1.id,
      user2_id: user2.id,
      ganador_id: user1.id,
      plantilla1_id: plantillas[0].id,
      plantilla2_id: plantillas[1].id,
    },
    {
      turno: 2,
      user1_id: user2.id,
      user2_id: user3.id,
      ganador_id: user2.id,
      plantilla1_id: plantillas[1].id,
      plantilla2_id: plantillas[2].id,
    },
    {
      turno: 3,
      user1_id: user1.id,
      user2_id: user3.id,
      ganador_id: user1.id,
      plantilla1_id: plantillas[0].id,
      plantilla2_id: plantillas[2].id,
    },
  ]);

  await amistadHelper.create([
    {
      id_usuario: user1.id,
      id_amigo: user2.id,
      estado: 'ACEPTADA',
    },
    {
      id_usuario: user2.id,
      id_amigo: user1.id,
      estado: 'ACEPTADA',
    },
  ]);

  await cartaHelper.create([
    {
      usuario_id: user1.id,
      posicion: 'Delantero',
      rareza: 'Normal',
      equipo: 'FC Barcelona',
      atributos: { ataque: 80, control: 60, defensa: 50 },
    },
    {
      usuario_id: user1.id,
      posicion: 'Defensa',
      rareza: 'Luxury',
      equipo: 'Real Madrid',
      atributos: { ataque: 40, control: 70, defensa: 90 },
    },
    {
      usuario_id: user2.id,
      posicion: 'Centrocampista',
      rareza: 'Megaluxury',
      equipo: 'Real Madrid',
      atributos: { ataque: 70, control: 85, defensa: 60 },
    },
  ]);


  return { user1, user2, user3 };
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

  const checkUser = await db
    .select()
    .from(user)
    .where(eq(user.email, testUserData.email))
    .limit(1);

  if (checkUser.length === 0) {
    throw new Error('No se pudo insertar el usuario de test');
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
