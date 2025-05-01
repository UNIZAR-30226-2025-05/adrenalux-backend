import request from 'supertest';
import { app } from '../../app.js';
import { getAuthToken, clearAllTables, seedTestData } from '../utils/dbHelper.js';
import { pool } from '../../config/db.js'; 

describe('Perfil de Usuario - Rutas', () => {
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


  it('Debería obtener el perfil del usuario', async () => {
    const response = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('username');
      expect(response.body.status).toMatchObject({
        error_code: 0,
        error_message: '',
      });
  });


  it('Debería actualizar el perfil del usuario', async () => {
    const updatedData = {
      username: 'newUsername',
      name: 'New Name',
      lastname: 'New Lastname',
    };

    const response = await request(app)
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', process.env.CURRENT_API_KEY)
      .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: {
          timestamp: expect.any(String),
          error_code: 0,
          error_message: '',
          elapsed: expect.any(Number),
        },
      });
  });


  it('Debería obtener el nivel y la experiencia del usuario', async () => {
    const response = await request(app)
      .get('/api/v1/profile/levelxp')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('level');
    expect(response.body.data).toHaveProperty('experience');
  });


  it('Debería obtener la clasificación del usuario', async () => {
    const response = await request(app)
      .get('/api/v1/profile/clasificacion')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('puntosClasificacion');
  });


  it('Debería cambiar la contraseña del usuario', async () => {
    const passwordData = {
      oldPassword: 'TestPassword123!',
      newPassword: 'newpassword123',
    };

    const response = await request(app)
      .put('/api/v1/profile/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: {
          timestamp: expect.any(String),
          error_code: 0,
          error_message: '',
          elapsed: expect.any(Number),
        },
      });
  });

  it('Debería obtener la lista de amigos del usuario', async () => {
    const response = await request(app)
      .get('/api/v1/profile/friends')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('Debería eliminar la cuenta del usuario', async () => {
    const response = await request(app)
      .delete('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User account deleted successfully');
  });
});
