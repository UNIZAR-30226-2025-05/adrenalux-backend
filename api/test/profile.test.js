import request from 'supertest';  // Supertest para hacer las solicitudes HTTP
import { app } from '../api/app'; // Tu instancia de Express

describe('GET /coleccion', () => {
  it('debería devolver una respuesta con un estado 200 y una lista de cartas', async () => {
    const res = await request(app).get('/coleccion');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0); // Asegurar que no esté vacío
    expect(res.body.data[0]).toHaveProperty('id'); // Verificar que los elementos tienen un ID
  });  
});
