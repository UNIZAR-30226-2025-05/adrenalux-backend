import request from 'supertest';
import { app } from '../../app.js';
import { getAuthToken, clearAllTables, seedTestData, cartaHelper } from '../../../api/test/utils/dbHelper.js';
import { TIPOS_CARTAS } from '../../config/cartas.config.js';
import { pool } from '../../config/db.js';

describe('Rutas de Partidas', () => {
  let token;
  let plantillaId;  
  let cartas;
  let user;
  beforeAll(async () => {
      await clearAllTables(); 
      const { user1, cartas: cartasCreadas } = await seedTestData();
      cartas = cartasCreadas;
      token = await getAuthToken({
        email: 'admin@example.com',
        password: '123456',
      });
    });
  
  afterAll(async () => {
    await clearAllTables();
    await pool.end();
  });

  it('POST /plantillas - debe crear una nueva plantilla', async () => {
    const response = await request(app)
      .post('/api/v1/plantillas')
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', process.env.CURRENT_API_KEY)
      .send({ nombre: 'Mi Plantilla' });

    expect(response.status).toBe(201);
    expect(response.body.plantilla).toHaveProperty('id');
    plantillaId = response.body.plantilla.id;
  });

  it('GET /plantillas - debe obtener todas las plantillas del usuario', async () => {
    const response = await request(app)
      .get('/api/v1/plantillas')
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', process.env.CURRENT_API_KEY);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('PUT /plantillas - debe actualizar el nombre de una plantilla', async () => {
    const response = await request(app)
      .put('/api/v1/plantillas')
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', process.env.CURRENT_API_KEY)
      .send({ plantillaId, nuevoNombre: 'Plantilla Renombrada' });

    expect(response.status).toBe(200);
  });

  it('POST /agregarCartasPlantilla - debe agregar cartas a una plantilla', async () => {
    const response = await request(app)
      .post('/api/v1/plantillas/agregarCartasPlantilla')
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', process.env.CURRENT_API_KEY)
      .send({
        plantillaId,
        cartasid: cartas.map(carta => carta.id),
        posiciones: ['Delantero', 'Centrocampista', 'Portero']
      });

    expect(response.status).toBe(200);
  });

  it('GET /getCartasporPlantilla/:id - debe obtener cartas de una plantilla', async () => {
    const response = await request(app)
      .get(`/api/v1/plantillas/getCartasporPlantilla/${plantillaId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', process.env.CURRENT_API_KEY);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('POST /activarPlantilla - debe activar una plantilla', async () => {
    const response = await request(app)
      .post('/api/v1/plantillas/activarPlantilla')
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', process.env.CURRENT_API_KEY)
      .send({ plantillaId });

    expect(response.status).toBe(200);
  });

  it('PUT /actualizarCarta - debe actualizar una carta en la plantilla', async () => {
    const nuevasCartas = await cartaHelper.create([
      {
        nombre: 'Marcos Llorente',
        alias: 'Llorente',
        posicion: 'Centrocampista',
        equipo: 'Atlético de Madrid',
        tipo_carta: TIPOS_CARTAS.NORMAL.nombre,
        escudo: 'https://example.com/escudo-llorente.png',
        pais: 'España',
        photo: 'https://example.com/photo-llorente.png',
        defensa: 60,
        control: 80,
        ataque: 70,
      }
    ]);
  
    const cartaidActual = cartas[0].id;
    const cartaidNueva = nuevasCartas[0].id;
  
    const response = await request(app)
      .put('/api/v1/plantillas/actualizarCarta')
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', process.env.CURRENT_API_KEY)
      .send({
        plantillaId,
        cartaidActual,
        cartaidNueva
      });
  
    console.log({
      plantillaId,
      cartaidActual,
      cartaidNueva
    });
  
    console.log(response.body);
    expect(response.status).toBe(200);
  });

  it('DELETE /plantillas - debe eliminar una plantilla', async () => {
    const response = await request(app)
      .delete('/api/v1/plantillas')
      .set('Authorization', `Bearer ${token}`)
      .set('x-api-key', process.env.CURRENT_API_KEY)
      .send({ plantillaIdNum: plantillaId });

    expect(response.status).toBe(200);
  });
});