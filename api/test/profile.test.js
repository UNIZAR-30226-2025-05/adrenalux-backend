import request from 'supertest';  // Supertest para hacer las solicitudes HTTP
import { app } from '../api/app'; // Tu instancia de Express

describe('GET /coleccion', () => {
  it('debería devolver una respuesta con un estado 200 y una lista de cartas', async () => {
    const res = await request(app).get('/coleccion');  // Realizamos la solicitud GET
    expect(res.status).toBe(200);  // Comprobamos que el estado es 200 (OK)
    expect(res.body).toHaveProperty('data');  // Verificamos que la respuesta tiene la propiedad 'data'
    expect(Array.isArray(res.body.data)).toBe(true);  // Comprobamos que 'data' es un array
  });
});
