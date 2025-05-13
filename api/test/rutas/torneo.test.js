import request from 'supertest';
import { app } from '../../app.js';
import { getAuthToken, clearAllTables, seedTestData } from '../../../api/test/utils/dbHelper.js';
import { pool } from '../../config/db.js';

describe('Rutas de Partidas', () => {
  let token;
  let token2;
  let torneoId; 
  let jugadorId;
  beforeAll(async () => {
      await clearAllTables(); 
      await seedTestData();
      token = await getAuthToken({
        email: 'admin@example.com',
        password: '123456',
      });
      token2 = await getAuthToken({
        email: 'test1@example.com',
        password: '123456',
      });
      jugadorId = token.username;
  });  
  afterAll(async () => {
    await clearAllTables();
    await pool.end();
  });

  describe('Torneos', () => {
    it('POST /torneos/crear - deberia crear un torneo', async () => {
      const res = await request(app)
        .post('/api/v1/torneos/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Torneo Prueba',
          premio: '1000',
          descripcion: 'Torneo Prueba para test',
          torneo_en_curso: true,
        });
  
      expect(res.status).toBe(200);
      expect(res.body.status.error_code).toBe(0); 
      expect(res.body.data).toHaveProperty('id');

      torneoId = res.body.data.id;
    });
  
    it('POST /torneos/unirse - deberia unirse a un torneo', async () => {
      const res = await request(app)
        .post('/api/v1/torneos/unirse')
        .set('Authorization', `Bearer ${token2}`)
        .send({ torneo_id: torneoId });
  
      expect(res.status).toBe(200);
      expect(res.body.status.error_code).toBe(0);
      expect(res.body.data).toBeDefined();
    });

    it('POST /torneos/iniciarTorneo - deberia iniciar el torneo si es creador', async () => {
        const res = await request(app)
        .post('/api/v1/torneos/iniciarTorneo')
        .set('Authorization', `Bearer ${token}`)
        .send({ torneo_id: torneoId });
    
        expect(res.status).toBe(200);
        expect(res.body.status.error_code).toBe(0);
        expect(res.body.data).toBeDefined();
    
        // Nueva petición para verificar que el torneo está en curso
        const torneoRes = await request(app)
          .get(`/api/v1/torneos/getTorneo/${torneoId}`)
          .set('Authorization', `Bearer ${token}`); 
      
        expect(torneoRes.status).toBe(200);
        expect(torneoRes.body.data.torneo.torneo_en_curso).toBe(true);
    });
  
    it('GET /torneos/getTorneosActivos - deberia obtener torneos activos', async () => {
      const res = await request(app).get('/api/v1/torneos/getTorneosActivos');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      if (res.body.data.length === 0) {
        console.log('No hay torneos activos actualmente');
      } else {
        console.log(`Se encontraron ${res.body.data.length} torneos activos`);
      }
    });
  
    it('GET /torneos/getTorneosJugador - deberia obtener torneos del jugador', async () => {
      const res = await request(app)
        .get('/api/v1/torneos/getTorneosJugador')
        .set('Authorization', `Bearer ${token}`)
        .query({ jugadorId });
  
      expect(res.status).toBe(200);
      expect(res.body.status.error_code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);

      console.log(`El jugador tiene ${res.body.data.length} torneos`);
    });
  
    it('GET /torneos/getTorneo/:id - deberia obtener detalles del torneo', async () => {
      const res = await request(app)
        .get(`/api/v1/torneos/getTorneo/${torneoId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status.error_code).toBe(0); 
      expect(res.body.data).toHaveProperty('torneo');
      expect(res.body.data).toHaveProperty('participantes');
    });
  
    it('GET /torneos/getTorneosAmigos - deberia obtener torneos de amigos', async () => {
      const res = await request(app)
        .get('/api/v1/torneos/getTorneosAmigos')
        .set('Authorization', `Bearer ${token}`);
  
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2); // Admin tiene 2 amigos con torneos
      
      const nombresEsperados = [
        'Torneo Test1 vs Test2', // creado por test1
        'Torneo Admin vs Test2', // creado por test2
      ];
      
      const nombresRecibidos = res.body.data.map(t => t.nombre);
      for (const nombre of nombresEsperados) {
        expect(nombresRecibidos).toContain(nombre);
      }
    });
  
    it('GET /torneos/torneo/:id/partidas - deberia obtener partidas del torneo', async () => {
      const res = await request(app)
        .get(`/api/v1/torneos/torneo/${torneoId}/partidas`)
        .set('Authorization', `Bearer ${token}`);
  
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /torneos/abandonarTorneo - deberia abandonar el torneo', async () => {
      await request(app)
        .post('/torneos/unirse')
        .set('Authorization', `Bearer ${token}`)
        .send({ torneo_id: torneoId });
  
      const res = await request(app)
        .post('/api/v1/torneos/abandonarTorneo')
        .set('Authorization', `Bearer ${token}`)
        .send({ torneo_id: torneoId });
  
      expect(res.status).toBe(200);
    });

    it('POST /torneos/finalizarTorneo - deberia finalizar el torneo y declarar un ganador', async () => {
        const res = await request(app)
          .post('/api/v1/torneos/finalizarTorneo')
          .set('Authorization', `Bearer ${token}`)
          .send({ torneo_id: torneoId, ganador_id: jugadorId });
    
        expect(res.status).toBe(200);
    });
  });
});