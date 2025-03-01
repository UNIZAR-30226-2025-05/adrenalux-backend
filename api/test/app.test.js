import { app } from '../api/app.js';  // Importa la instancia de Express
import request from 'supertest';       // Librería para hacer peticiones HTTP en las pruebas

describe('App Tests', () => {
  it('should return 200 OK for the root route', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hola Mundo');
  });

  // Otros tests para la app
});
