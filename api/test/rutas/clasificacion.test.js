import request from 'supertest';
import { app } from '../../app.js';
import { getAuthToken, clearAllTables, seedTestData } from '../../../api/test/utils/dbHelper.js';
import { pool } from '../../config/db.js';

describe('Rutas /clasificacion', () => {
  let token;

  beforeAll(async () => {
    await clearAllTables();
    await seedTestData();
    token = await getAuthToken({
      email: 'admin@example.com',
      password: '123456',
  });

  });

  });

  afterAll(async () => {
    await clearAllTables();
    await pool.end();
  });

  describe('GET /clasificacion/total', () => {
    it('debe devolver la clasificación total con status 200 y datos de usuarios ordenados', async () => {
      const res = await request(app)
        .get('/clasificacion/total')
        .set('Authorization', `Bearer ${token}`);
  
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
  
      const expectedFields = [
        'userid', 'username', 'name', 'lastname', 'avatar',
        'friend_code', 'level', 'experience', 'clasificacion', 'estadisticas'
      ];
  
      res.body.data.forEach(user => {
        expectedFields.forEach(field => {
          expect(user).toHaveProperty(field);
        });
  
        expect(user.estadisticas).toHaveProperty('partidasJugadas');
        expect(user.estadisticas).toHaveProperty('partidasGanadas');
        expect(user.estadisticas).toHaveProperty('partidasPerdidas');
      });
    });
  
    it('debe devolver 401 si no se envía token', async () => {
      const res = await request(app).get('/clasificacion/total');
      expect(res.status).toBe(401);
    });
  });
  
  describe('GET /clasificacion/amigos', () => {
    it('debe devolver la clasificación de amigos con status 200', async () => {
      const res = await request(app)
        .get('/clasificacion/amigos')
        .set('Authorization', `Bearer ${token}`);
  
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
  
      res.body.data.forEach(friend => {
        expect(friend).toHaveProperty('userid');
        expect(friend).toHaveProperty('username');
        expect(friend).toHaveProperty('name');
        expect(friend).toHaveProperty('lastname');
        expect(friend).toHaveProperty('avatar');
        expect(friend).toHaveProperty('friend_code');
        expect(friend).toHaveProperty('level');
        expect(friend).toHaveProperty('experience');
        expect(friend).toHaveProperty('clasificacion');
        expect(friend).toHaveProperty('estadisticas');
        expect(friend.estadisticas).toHaveProperty('partidasJugadas');
        expect(friend.estadisticas).toHaveProperty('partidasGanadas');
        expect(friend.estadisticas).toHaveProperty('partidasPerdidas');
      });
    });
  
    it('debe devolver 401 si no se envía token', async () => {
      const res = await request(app).get('/clasificacion/amigos');
      expect(res.status).toBe(401);
    });
  });
