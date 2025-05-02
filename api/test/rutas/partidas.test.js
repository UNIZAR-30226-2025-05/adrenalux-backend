import request from 'supertest';
import { app } from '../../app.js';
import { getAuthToken, clearAllTables, seedTestData } from '../../../api/test/utils/dbHelper.js';
import { pool } from '../../config/db.js';

describe('Rutas de Partidas', () => {
  let token; 
  beforeAll(async () => {
      await clearAllTables(); 
      await seedTestData();
      token = await getAuthToken({
        email: 'admin@example.com',
        password: '123456',
      });
    });
  
  afterAll(async () => {
    await clearAllTables();
    await pool.end();
  });

  it('debe retornar 200 y las partidas pausadas del usuario', async () => {
    const response = await request(app)
      .get('/api/v1/partidas/pausadas')
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', process.env.CURRENT_API_KEY);
  
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.pausedMatches)).toBe(true);
    expect(response.body.data.pausedMatches.length).toBeGreaterThanOrEqual(0); 
    if (response.body.data.pausedMatches.length > 0) { 
        expect(response.body.data.pausedMatches[0]).toHaveProperty('estado', 'pausada');
    }
  });

  it('debe retornar 401 si no se envía un token válido', async () => {
    const response = await request(app)
      .get('/api/v1/partidas/pausadas')
      .set('Authorization', 'Bearer invalidToken')
      .set('x-api-key', process.env.CURRENT_API_KEY);
  
    expect(response.status).toBe(401);
    expect(response.body.status.error_message).toBe('Invalid or missing token');
  });
  
  
});