import request from 'supertest';
import { app } from '../../app.js';
import { getAuthToken, clearAllTables, seedTestData } from '../../../api/test/utils/dbHelper.js';
import { pool } from '../../config/db.js';
import { TIPOS_CARTAS, TIPOS_SOBRES } from '../../config/cartas.config.js'; // Importa los tipos de cartas

describe('Rutas de Cartas', () => {
  let token;
  let user;

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

  describe('GET /api/v1/cartas/abrirSobre/:tipo', () => {
    it('debe abrir un sobre de tipo ENERGIA_LUX', async () => {
      const tipo = TIPOS_SOBRES.ENERGIA_LUX; 
      const response = await request(app)
        .get(`/api/v1/cartas/abrirSobre/${tipo}`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);
    
      console.log("ENERGIA_LUX", response.body);
      expect(response.status).toBe(200);
      expect(response.body.data.responseJson.cartas).toBeDefined();  
      expect(Array.isArray(response.body.data.responseJson.cartas)).toBe(true);  
      expect(response.body.data.responseJson.cartas.length).toBeGreaterThan(0); // Verifica que haya cartas
    });
    
    it('debe abrir un sobre de tipo ELITE_LUX', async () => {
      const tipo = TIPOS_SOBRES.ELITE_LUX;
      const response = await request(app)
        .get(`/api/v1/cartas/abrirSobre/${tipo}`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);
    
      console.log("ELITE_LUX", response.body);
      expect(response.status).toBe(200);
      expect(response.body.data.responseJson.cartas).toBeDefined();  
      expect(Array.isArray(response.body.data.responseJson.cartas)).toBe(true);  
      expect(response.body.data.responseJson.cartas.length).toBeGreaterThan(0);
    });
    
    it('debe abrir un sobre de tipo MASTER_LUX', async () => {
      const tipo = TIPOS_SOBRES.MASTER_LUX;
      const response = await request(app)
        .get(`/api/v1/cartas/abrirSobre/${tipo}`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);
    
      console.log("MASTER_LUX", response.body);
      expect(response.status).toBe(200);
      expect(response.body.data.responseJson.cartas).toBeDefined();  
      expect(Array.isArray(response.body.data.responseJson.cartas)).toBe(true);  
      expect(response.body.data.responseJson.cartas.length).toBeGreaterThan(0);
    });
    

    it('debe retornar error si el tipo de sobre no es válido', async () => {
      const tipo = 'INVALIDO';
      const response = await request(app)
        .get(`/api/v1/cartas/abrirSobre/${tipo}`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(400);
      expect(response.body.status.error_message).toBe('Tipo de sobre no definido');
    });

    it('debe devolver error si no hay monedas suficientes', async () => {
      const tipo = TIPOS_SOBRES.MASTER_LUX; 
      const response = await request(app)
        .get(`/api/v1/cartas/abrirSobre/${tipo}`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(401);
      expect(response.body.status.error_message).toBe('Monedas insuficientes');
    });
  });

  describe('GET /api/v1/cartas/abrirSobreRandom', () => {
    it('debe abrir un sobre aleatorio exitosamente', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/abrirSobreRandom')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.data.responseJson.cartas).toBeDefined();
      expect(Array.isArray(response.body.data.responseJson.cartas)).toBe(true);
    });
    
    it('debe devolver error si no hay sobres gratis disponibles', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/abrirSobreRandom')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.body.ultimo_sobre_gratis ?? null).toBeNull();
      expect(response.status).toBe(401);
      expect(response.body.status.error_message).toBe('No tienes sobres gratis disponibles');
    });
  });

  describe('GET /api/v1/cartas/getEquipos', () => {
    it('debe devolver la lista de equipos', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/getEquipos')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.data.equipo).toBeInstanceOf(Array);
      expect(response.body.data.equipo.length).toBeGreaterThan(0); 
    });
  });

  describe('GET /api/v1/cartas/getInfoSobres', () => {
    it('debe devolver información detallada de los sobres', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/getInfoSobres')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      const sobres = response.body.data;

      expect(sobres['SobreGratis']).toBeDefined();
      expect(sobres['Sobre Energia Lux']).toBeDefined();
      expect(sobres['Sobre Elite Lux']).toBeDefined();
      expect(sobres['Sobre Master Lux']).toBeDefined();
    });
  });

  describe('GET /api/v1/cartas/getPosiciones', () => {
    it('debe devolver la lista de posiciones', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/getPosiciones')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.data.equipos).toBeInstanceOf(Array);
      expect(response.body.data.equipos.length).toBeGreaterThan(0); 
    });
  });

  describe('GET /api/v1/cartas/sobres', () => {
    it('debe devolver los sobres disponibles', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/sobres')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true); 
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/cartas/getRarezascartas', () => {
    it('debe devolver las rarezas de las cartas', async () => {
      const response = await request(app)
        .get('/api/v1/cartas/getRarezascartas')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Object.keys(response.body.data).length).toBeGreaterThan(0);
    });
  });
});
