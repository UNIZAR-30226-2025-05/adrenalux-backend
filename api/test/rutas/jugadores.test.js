import request from 'supertest';
import { app } from '../../app.js';
import { getAuthToken } from '../../../api/test/utils/dbHelper.js';
import { TIPOS_CARTAS } from '../../config/cartas.config.js';

let token; 

beforeAll(async () => {
  token = await getAuthToken();
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
        .send(cartas);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status.error_code).toBeGreaterThan(0);
      expect(response.body.status.error_message).toMatch(/nombre/i);
    });

    it('Debería devolver un error si no se proporciona un token', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/insertar')
        .send([]);

      expect(response.status).toBe(401);
      expect(response.body.status.error_message).toBe('Invalid or missing token');
    });
  });

  describe('POST /jugadores/generar-luxuryxi', () => {
    it('Debería generar cartas LuxuryXI correctamente', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/generar-luxuryxi')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status.error_code).toBe(0);
    });

    it('Debería fallar sin token', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/generar-luxuryxi');

      expect(response.status).toBe(401);
      expect(response.body.status.error_message).toBe('Invalid or missing token');
    });
  });

  describe('POST /jugadores/generar-megaluxury', () => {
    it('Debería generar cartas MegaLuxury correctamente', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/generar-megaluxury')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status.error_code).toBe(0);
    });

    it('Debería fallar sin token', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/generar-megaluxury');

      expect(response.status).toBe(401);
      expect(response.body.status.error_message).toBe('Invalid or missing token');
    });
  });

  describe('POST /jugadores/generar-luxury', () => {
    it('Debería generar cartas Luxury correctamente', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/generar-luxury')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status.error_code).toBe(0);
    });

    it('Debería fallar sin token', async () => {
      const response = await request(app)
        .post('/api/v1/jugadores/generar-luxury');

      expect(response.status).toBe(401);
      expect(response.body.status.error_message).toBe('Invalid or missing token');
    });
  });
});
