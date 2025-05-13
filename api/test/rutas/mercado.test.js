import request from 'supertest';
import { app } from '../../app.js';
import { getAuthToken, clearAllTables, seedTestData, cartaHelper, coleccionHelper } from '../../../api/test/utils/dbHelper.js';
import { pool } from '../../config/db.js';
import { TIPOS_CARTAS } from '../../config/cartas.config.js';

let token;
let user;
let plantillaId;
let cartas;
let nuevaCarta;
let testData;

beforeAll(async () => {
  await clearAllTables();
  testData = await seedTestData();
  user = testData.user1;
  cartas = testData.cartas;

  token = await getAuthToken({
    email: 'admin@example.com',
    password: '123456',
  });
});

afterAll(async () => {
  await clearAllTables();
  await pool.end();
});

describe('MercadoDiario', () => {
  let cartaEspecialId;

  it('GET /mercadoDiario/obtenerCartasEspeciales - debe devolver cartas especiales del dia', async () => {
    const response = await request(app)
      .get('/api/v1/mercado/mercadoDiario/obtenerCartasEspeciales');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);

    if (response.body.data.length > 0) {
      cartaEspecialId = response.body.data[0].id;
    }
  });

  it('POST /mercadoDiario/comprarCartaEspecial/:id - debe comprar una carta especial', async () => {
    if (!cartaEspecialId) return;

    const response = await request(app)
      .post(`/api/v1/mercado/mercadoDiario/comprarCartaEspecial/${cartaEspecialId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.status?.error_code).toBe(0);
  });
});

describe('MercadoCartas', () => {
  let cartaIdPuestaEnVenta;

  it('POST /mercadoCartas/venderCarta - debe publicar una carta en el mercado', async () => {
    // Carta 1 del seedData debe pertenecer al usuario
    const cartaId = cartas[0].id; 
    const precio = 500; 

    const response = await request(app)
      .post('/api/v1/mercado/mercadoCartas/venderCarta')
      .set('Authorization', `Bearer ${token}`)
      .send({ cartaId, precio });

    console.log({ cartaId });
    console.log(response.body);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
  });

  it('DELETE /mercadoCartas/retirarCarta/:id - debe retirar una carta del mercado', async () => {
    const cartaIdPuestaEnVenta = cartas[0].id;
    const response = await request(app)
      .delete(`/api/v1/mercado/mercadoCartas/retirarCarta/${cartaIdPuestaEnVenta}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('GET /mercadoCartas/obtenerCartasMercado - debe listar cartas en el mercado', async () => {
    const response = await request(app)
      .get('/api/v1/mercado/mercadoCartas/obtenerCartasMercado');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('POST /mercadoCartas/comprarCarta/:id - debe comprar una carta del mercado', async () => {
    const nuevaCarta = await cartaHelper.create([
    {
      nombre: 'Pedri',
      alias: 'Pedri',
      posicion: 'Centrocampista',
      equipo: 'FC Barcelona',
      tipo_carta: TIPOS_CARTAS.NORMAL.nombre,
      escudo: 'https://example.com/barcelona.png',
      pais: 'España',
      photo: 'https://example.com/pedri.png',
      defensa: 60,
      control: 85,
      ataque: 70,
    }
   ]);

   const cartaId = nuevaCarta[0].id;
   await coleccionHelper.create([{ user_id: testData.user2.id, carta_id: cartaId }]);
   const tokenUser2 = await getAuthToken({ email: 'test1@example.com', password: '123456' });

   const ponerVentaRes = await request(app)
    .post('/api/v1/mercado/mercadoCartas/venderCarta')
    .set('Authorization', `Bearer ${tokenUser2}`)
    .set('x-api-key', process.env.CURRENT_API_KEY)
    .send({
      cartaId: cartaId,
      precio: 500
    });

  if (!ponerVentaRes.body.success) {
    console.error('Error al poner en venta:', ponerVentaRes.body);
    throw new Error('Fallo en venderCarta');
  }
    
  console.log('ponerVentaRes.body:', ponerVentaRes.body);
  expect(ponerVentaRes.status).toBe(201);
  const ventaId = ponerVentaRes.body.data[0].id;

  const comprarRes = await request(app)
    .post(`/api/v1/mercado/mercadoCartas/comprarCarta/${ventaId}`)
    .set('Authorization', `Bearer ${token}`) // token de user1
    .set('x-api-key', process.env.CURRENT_API_KEY);

  console.log(comprarRes.body);
  expect(comprarRes.status).toBe(200);
  expect(comprarRes.body).toHaveProperty('success', true);
  expect(comprarRes.body).toHaveProperty('message', 'Carta comprada y añadida a tu colección exitosamente');
  });
});

describe('Administración de Mercado', () => {
  it('POST /generarCartasMercado - debe generar cartas diarias con API Key', async () => {
    const response = await request(app)
      .post('/api/v1/mercado/generarCartasMercado')
      .set('x-api-key', process.env.CURRENT_API_KEY);

    expect(response.status).toBe(200);
  });
});
