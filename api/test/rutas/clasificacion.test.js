import request from 'supertest';
import { app } from '../../app.js';
import { clearAllTables, seedTestData, getAuthToken } from '../utils/dbHelper.js';
import { partidaHelper, plantillaHelper, amistadHelper,userHelper } from '../utils/dbHelper.js';
import { eq } from 'drizzle-orm';
import { user } from '../../db/schemas/user.js';
import { pool } from '../../config/db.js'; 

describe('Rutas de Clasificacion', () => {
  let token;
  let testUser;
  let amigo;
  let plantilla1;
  let plantilla2;

  beforeEach(async () => {
    await clearAllTables();

    // Creamos un usuario y su amigo
    const result = await seedTestData();
    testUser = result.testUser;

    [amigo] = await userHelper.create({
      username: 'amigo1',
      email: 'amigo1@example.com',
      password: 'password123',
      salt: 'salty',
      friend_code: 'FRIEND1',
      name: 'Amigo',
      lastname: 'Uno',
    });

    // Creamos la relación de amistad
    await amistadHelper.create({
      user1_id: testUser.id,
      user2_id: amigo.id,
      estado: 'ACEPTADA',
    });

    plantilla1 = await plantillaHelper.create({
        user_id: testUser.id,
        nombre: 'Plantilla de Test 1',
    });

    expect(plantilla1[0]).toHaveProperty('id');  

    plantilla2 = await plantillaHelper.create({
        user_id: amigo.id,
        nombre: 'Plantilla de Test 2',
    });

    expect(plantilla2[0]).toHaveProperty('id');  

    // Creamos partidas para ambos
    await partidaHelper.create([
      {
        turno: 1,
        estado: 'parada',
        puntuacion1: 0,
        puntuacion2: 0,
        ganador_id: testUser.id,
        user1_id: testUser.id,
        user2_id: amigo.id,
        plantilla1_id: plantilla1[0].id, 
        plantilla2_id: plantilla2[0].id, 
        torneo_id: null, 
      },
      {
        turno: 2, 
        estado: 'parada',
        puntuacion1: 0,
        puntuacion2: 0,
        ganador_id: amigo.id,
        user1_id: amigo.id,
        user2_id: testUser.id,
        plantilla1_id: plantilla1[0].id, 
        plantilla2_id: plantilla2[0].id, 
        torneo_id: null, 
      },
    ]);

    token = await getAuthToken();
  });

  afterAll(async () => {
    await clearAllTables();
    await pool.end(); 
  });

  describe('GET /api/v1/clasificacion/total', () => {
    it('debe retornar la clasificacion total con datos de usuarios', async () => {
      const res = await request(app)
        .get('/api/v1/clasificacion/total')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      // Aseguramos que contenga el usuario test
      const found = res.body.data.find(u => u.id === testUser.id);
      expect(found).toBeDefined();
      expect(found).toHaveProperty('puntosClasificacion');
    });

    it('debe retornar 401 si no hay token', async () => {
      const res = await request(app)
        .get('/api/v1/clasificacion/total')
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/clasificacion/amigos', () => {
    it('debe retornar solo los amigos del usuario', async () => {
      const res = await request(app)
        .get('/api/v1/clasificacion/amigos')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      const ids = res.body.data.map(u => u.id);
      expect(ids).toContain(amigo.id);
      expect(ids).not.toContain(999999); // id falso
    });

    it('debe retornar 401 si no hay token', async () => {
      const res = await request(app)
        .get('/api/v1/clasificacion/amigos')
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(res.status).toBe(401);
    });
  });
});
