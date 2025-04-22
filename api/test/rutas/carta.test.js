import request from 'supertest';
import { app } from '../../app.js';
import { getAuthToken, clearAllTables, seedTestData } from '../../../api/test/utils/dbHelper.js';
import { pool } from '../../config/db.js';
import { TIPOS_CARTAS } from '../../config/cartas.config.js'; // Importa los tipos de cartas

describe('Rutas de Cartas', () => {
  let token;
  let user;

  beforeAll(async () => {
    const data = await seedTestData();
    user = data.user1;
    token = await getAuthToken(); 
  });

  afterAll(async () => {
    await clearAllTables();
    await pool.end();
  });

  describe('GET /api/v1/cartas/abrirSobre/:tipo', () => {
    it('debe abrir un sobre de tipo NORMAL', async () => {
      const tipo = TIPOS_CARTAS.NORMAL.nombre;
      const response = await request(app)
        .get(`/api/v1/cartas/abrirSobre/${tipo}`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.data.cartas).toBeDefined();
      expect(Array.isArray(response.body.data.cartas)).toBe(true);
      expect(response.body.data.cartas.length).toBeGreaterThan(0); // Verifica que haya cartas
    });

    it('debe abrir un sobre de tipo LUXURY', async () => {
      const tipo = TIPOS_CARTAS.LUXURY.nombre;
      const response = await request(app)
        .get(`/api/v1/cartas/abrirSobre/${tipo}`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.data.cartas).toBeDefined();
      expect(Array.isArray(response.body.data.cartas)).toBe(true);
      expect(response.body.data.cartas.length).toBeGreaterThan(0);
    });

    it('debe retornar error si el tipo de sobre no es válido', async () => {
      const tipo = 'INVALIDO';
      const response = await request(app)
        .get(`/api/v1/cartas/abrirSobre/${tipo}`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(400);
      expect(response.body.error_message).toBe('Tipo de sobre no definido');
    });

    it('debe retornar error si no hay monedas suficientes', async () => {
      const tipo = TIPOS_CARTAS.MEGALUXURY.nombre; // Suponiendo que el test usuario no tenga monedas suficientes
      const response = await request(app)
        .get(`/api/v1/cartas/abrirSobre/${tipo}`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(401);
      expect(response.body.error_message).toBe('Monedas insuficientes');
    });
  });

  describe('GET /api/v1/cartas/abrirSobreRandom', () => {
    it('debe abrir un sobre aleatorio exitosamente', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/abrirSobreRandom')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.data.cartas).toBeDefined();
      expect(Array.isArray(response.body.data.cartas)).toBe(true);
    });

    it('debe retornar error si no hay sobres gratis disponibles', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/abrirSobreRandom')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(401);
      expect(response.body.error_message).toBe('No tienes sobres gratis disponibles');
    });
  });

  describe('GET /api/v1/cartas/getEquipos', () => {
    it('debe retornar la lista de equipos', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/getEquipos')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0); // Suponiendo que hay equipos en la base de datos
    });
  });

  describe('GET /api/v1/cartas/getInfoSobres', () => {
    it('debe retornar información detallada de los sobres', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/getInfoSobres')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.sobres_gratuitos).toBeDefined();
      expect(response.body.precios_sobres).toBeDefined();
      expect(response.body.probabilidades_cartas).toBeDefined();
    });
  });

  describe('GET /api/v1/cartas/getPosiciones', () => {
    it('debe retornar la lista de posiciones', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/getPosiciones')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0); // Suponiendo que hay posiciones en la base de datos
    });
  });

  describe('GET /api/v1/cartas/sobres', () => {
    it('debe retornar los sobres disponibles', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/sobres')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.sobres).toBeDefined();
      expect(response.body.sobres.ELITE_LUX).toBeDefined();
      expect(response.body.sobres.MASTER_LUX).toBeDefined();
    });
  });

  describe('GET /api/v1/cartas/getRarezascartas', () => {
    it('debe retornar las rarezas de las cartas', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/getRarezascartas')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.rarezas).toBeDefined();
      expect(response.body.rarezas.length).toBeGreaterThan(0);
    });
  });
});
