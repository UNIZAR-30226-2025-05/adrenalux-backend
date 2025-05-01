import request from 'supertest';
import { app } from '../../app.js';
import { getAuthToken, clearAllTables, seedTestData } from '../../../api/test/utils/dbHelper.js';
import { TIPOS_CARTAS } from '../../config/cartas.config.js';
import { pool } from '../../config/db.js'; 


let token; 

beforeAll(async () => {
  token = await getAuthToken();
});

afterAll(async () => {
  await clearAllTables();
  await pool.end(); 
});

describe('Rutas de Jugadores', () => {
  describe('POST /jugadores/insertar', () => {
    it('Debería insertar una carta correctamente', async () => {
      const cartas = [
        {
          nombre: 'Pablo Torre',
          alias: 'Pablo Torre',
          posicion: 'midfielder',
          equipo: 'Fc Barcelona',
          tipo_carta: TIPOS_CARTAS.NORMAL,
          escudo: 'barcelona.png',
          pais: 'España',
          photo: 'pablo_torre.png',
          defensa: 75,
          control: 75,
          ataque: 75
        }
      ];

      const response = await request(app)
        .post('/api/v1/jugadores/insertar')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY)
        .send(cartas);

      console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status.error_code).toBe(0);
    });

    it('Debería devolver un error si falta un campo obligatorio', async () => {
      const cartas = [
        {
            alias: 'Pablo Torre',
            posicion: 'midfielder',
            equipo: 'Fc Barcelona',
            tipo_carta: TIPOS_CARTAS.NORMAL,
            escudo: 'barcelona.png',
            pais: 'España',
            photo: 'pablo_torre.png',
            defensa: 75,
            control: 75,
            ataque: 75
        }
      ];

      const response = await request(app)
        .post('/api/v1/jugadores/insertar')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY)
        .send(cartas);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status.error_code).toBe(0);

      if (response.body.data) {
        expect(response.body.data).toHaveProperty('inserted');
        expect(response.body.data).toHaveProperty('failed');
        expect(response.body.data.inserted).toBe(0);
        expect(response.body.data.failed).toBe(1);
      }
    });

    it('Debería devolver un error si no se proporciona un token', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/insertar')
        .send([]);

      console.log(response.status);
      console.log(response.body);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid API Key');
    });
  });

  describe('POST /jugadores/generar-luxuryxi', () => {
    it('Debería generar cartas LuxuryXI correctamente', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/generar-luxuryxi')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.status.error_code).toBe(0);
    });

    it('Debería fallar sin token', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/generar-luxuryxi')
        .set('x-api-key', process.env.CURRENT_API_KEY);

      console.log(response.status);
      console.log(response.body);
      
      expect(response.status).toBe(403);
      expect(response.body.status).toHaveProperty('error_message');
      expect(response.body.status.error_message).toBe('Invalid or missing token');
    });
  });

  describe('POST /jugadores/generar-megaluxury', () => {
    it('Debería generar cartas MegaLuxury correctamente', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/generar-megaluxury')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.status.error_code).toBe(0);
    });

    it('Debería fallar sin token', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/generar-megaluxury');

      console.log(response.status);
      console.log(response.body);
      
      expect(response.status).toBe(403);
      expect(response.body.status).toHaveProperty('error_message');
      expect(response.body.status.error_message).toBe('Invalid or missing token');
    });
  });

  describe('POST /jugadores/generar-luxury', () => {
    it('Debería generar cartas Luxury correctamente', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/generar-luxury')
        .set('Authorization', `Bearer ${token}`)
        .set('x-api-key', process.env.CURRENT_API_KEY);

      expect(response.status).toBe(200);
      expect(response.body.status.error_code).toBe(0);
    });

    it('Debería fallar sin token', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/generar-luxury')
        .set('x-api-key', process.env.CURRENT_API_KEY);

      console.log(response.status);
      console.log(response.body);
      
      expect(response.status).toBe(403);
      expect(response.body.status).toHaveProperty('error_message');
      expect(response.body.status.error_message).toBe('Invalid or missing token');
    });
  });
});
