import request from 'supertest';
import { app } from '../../app.js';
import { getAuthToken, clearAllTables, seedTestData } from '../utils/dbHelper.js';
import { pool } from '../../config/db.js'; 
import { TIPOS_FILTROS } from '../../config/cartas.config.js';

describe('Colección de Cartas', () => {
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

  describe('GET /getColeccion', () => {
    it('debe retornar la colección del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/v1/coleccion/getColeccion')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0); // Si esperamos que la colección no esté vacía
    });

    it('debe retornar 401 si el token no es válido', async () => {
      const response = await request(app)
        .get('/api/v1/coleccion/getColeccion')
        .set('Authorization', 'Bearer invalidToken')
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(401);
      expect(response.body.status?.error_message).toBe('Invalid or missing token');
    });

    it('debe retornar 401 si no hay token', async () => {
      const response = await request(app)
        .get('/api/v1/coleccion/getColeccion')
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(401);
      expect(response.body.status?.error_message).toBe('Invalid or missing token');
    });
  });

  describe('GET /filtrarCartas', () => {
    it('debe filtrar cartas por posición, rareza y equipo', async () => {
      const response = await request(app)
        .get('/api/v1/coleccion/filtrarCartas')
        .query({
          posicion: 'Delantero',
          rareza: 'Normal',
          equipo: 'FC Barcelona',
        })
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);
    
      expect(response.status).toBe(200);
      expect(response.body.status.error_code).toBe(0);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('debe retornar 401 si el token no es válido', async () => {
      const response = await request(app)
        .get('/api/v1/coleccion/filtrarCartas')
        .query({ posicion: TIPOS_FILTROS.POSICION, rareza: TIPOS_FILTROS.RAREZA, equipo: TIPOS_FILTROS.EQUIPO })
        .set('Authorization', 'Bearer invalidToken')
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(401);
      expect(response.body.status?.error_message).toBe('Invalid or missing token');
    });

    it('debe retornar 401 si no hay token', async () => {
      const response = await request(app)
        .get('/api/v1/coleccion/filtrarCartas')
        .query({ posicion: TIPOS_FILTROS.POSICION, rareza: TIPOS_FILTROS.RAREZA, equipo: TIPOS_FILTROS.EQUIPO })
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(401);
      expect(response.body.status?.error_message).toBe('Invalid or missing token');
    });
  });

  describe('GET /filtrarPorEquipo/:equipo', () => {
    it('debe filtrar cartas por equipo', async () => {
      const response = await request(app)
        .get('/api/v1/coleccion/filtrarPorEquipo/FC Barcelona')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0); // Si esperamos encontrar cartas para ese equipo
    });

    it('debe retornar 400 si no se encuentran cartas para el equipo', async () => {
      const response = await request(app)
        .get('/api/v1/coleccion/filtrarPorEquipo/EquipoInexistente')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);
    
      expect(response.status).toBe(400);
      expect(response.body.status.error_code).toBe(1000);
      expect(response.body.status.error_message).toBe('No se encontraron cartas para el equipo especificado');
    });

    it('debe retornar 401 si el token no es válido', async () => {
      const response = await request(app)
        .get('/api/v1/coleccion/filtrarPorEquipo/FC Barcelona')
        .set('Authorization', 'Bearer invalidToken')
        .set('x-api-key', process.env.CURRENT_API_KEY);
    
      expect(response.status).toBe(401);
      expect(response.body.status.error_code).toBe(1000);
      expect(response.body.status.error_message).toBe('Invalid or missing token');
    });
    

    it('debe retornar 401 si no hay token', async () => {
      const response = await request(app)
        .get('/api/v1/coleccion/filtrarPorEquipo/FC Barcelona')
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(401);
      expect(response.body.status.error_code).toBe(1000);
      expect(response.body.status.error_message).toBe('Invalid or missing token');
    });
  });
});
