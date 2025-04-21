import request from 'supertest';
import { app } from '../../app.js';
import { getAuthToken, clearAllTables } from '../utils/dbHelper.js';
import { pool } from '../../config/db.js'; 

let token; 

beforeAll(async () => {
  token = await getAuthToken();
});

afterAll(async () => {
    await clearAllTables();
    await pool.end(); 
  });

describe('Rutas de prueba', () => {

  // Test para la ruta /ping (sin autenticación)
  it('Deberia responder correctamente a /ping', async () => {
    const response = await request(app).get('/ping');
    
    // Comprobamos el código de estado
    expect(response.status).toBe(200);
    
    // Verificamos que la estructura de la respuesta sea correcta
    expect(response.body.status).toHaveProperty('timestamp');
    expect(response.body.status).toHaveProperty('error_code', 0);
    expect(response.body.status).toHaveProperty('error_message', '');
    expect(response.body.status).toHaveProperty('elapsed');

    expect(response.body).not.toHaveProperty('data');
    expect(response.body).not.toHaveProperty('meta');
  });

  it('Deberia responder correctamente a /secured-ping si el token es valido', async () => {    
    const response = await request(app)
      .get('/secured-ping')
      .set('Authorization', `Bearer ${token}`);
    
    // Comprobamos el código de estado
    expect(response.status).toBe(200);
    
    // Verificamos la estructura de la respuesta
    expect(response.body.status).toHaveProperty('timestamp');
    expect(response.body.status).toHaveProperty('error_code', 0);
    expect(response.body.status).toHaveProperty('error_message', '');
    expect(response.body.status).toHaveProperty('elapsed');

    expect(response.body).not.toHaveProperty('data');
    expect(response.body).not.toHaveProperty('meta');
  });

  it('Deberia devolver un error 401 a /secured-ping si no hay token o el token es invalido', async () => {
    const response = await request(app).get('/secured-ping');
    
    expect(response.status).toBe(401);
    
    expect(response.body.status).toHaveProperty('error_code', 401);
    expect(response.body.status).toHaveProperty('error_message', 'Invalid or missing token');
    
    // Verificamos que la respuesta no contenga "data" ni "meta"
    expect(response.body).not.toHaveProperty('data');
    expect(response.body).not.toHaveProperty('meta');
  });

});
