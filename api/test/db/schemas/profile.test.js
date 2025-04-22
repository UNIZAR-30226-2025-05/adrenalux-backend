import request from 'supertest';  // Supertest para hacer las solicitudes HTTP
import { app } from '../../../app.js';
import { db } from '../../../config/db.js';
import { user } from '../../../db/schemas/user.js';
import { carta } from '../../../db/schemas/carta.js';
import { eq } from 'drizzle-orm';
import { coleccion } from '../../../db/schemas/coleccion.js';
import { pbkdf2Sync } from 'crypto';
import { getDecodedToken, verifyToken } from '../../../lib/jwt.js';

const HASH_CONFIG = {
  iterations: 10000,
  keyLength: 64,
  digest: 'sha512'
};

describe('GET /coleccion', () => {
  let testUserId;
  let testCartaId;

  const mockUser = {
    username: 'testuser_collection',
    email: 'test_collection@example.com',
    name: 'Test',
    lastname: 'User',
    password: 'password123', 
    friend_code: Math.random().toString().slice(2,12), 
    adrenacoins: 100,
    name: 'Test',
    lastname: 'User',
    level: 1,
    experience: 0,
    puntosClasificacion: 0,
    avatar: 'assets/default_profile.jpg'
  };

  const salt = 'random_salt_placeholder';
  const hashedPassword = pbkdf2Sync(
    mockUser.password,
    salt,
    HASH_CONFIG.iterations,
    HASH_CONFIG.keyLength,
    HASH_CONFIG.digest
  ).toString('hex');

  
  const mockCarta = {
    nombre: 'Messi GOAT',
    alias: 'GOAT', 
    posicion: 'Delantero',
    equipo: 'PSG',
    tipo_carta: 'Especial',
    escudo: 'https://ejemplo.com/escudo-psg.png',
    pais: 'Argentina',
    photo: 'https://ejemplo.com/messi-photo.jpg',
    defensa: 85,
    control: 95,
    ataque: 99
  };

  let testToken;

  beforeAll(async () => {
    const signUpRes = await request(app)
      .post('/api/v1/auth/sign-up')
      .send({
        email: mockUser.email,
        password: mockUser.password,
        username: mockUser.username,
        name: mockUser.name,
        lastname: mockUser.lastname
      });

    if (signUpRes.status !== 201) {
      throw new Error(`Registro fallido: ${JSON.stringify(signUpRes.body)}`);
    }

    const signInRes = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({
        email: mockUser.email,
        password: mockUser.password
      });


      if (signInRes.status !== 200) {
        throw new Error(`Login fallido: ${JSON.stringify(signInRes.body)}`);
      }
      
      const token = signInRes.body.data.token;
      const decoded = await verifyToken(token); 
      
      testUserId = decoded.id; 
      testToken = token;

      const [newCarta] = await db.insert(carta).values(mockCarta).returning();
      testCartaId = newCarta.id;

      await db.insert(coleccion).values({
        user_id: testUserId,
        carta_id: testCartaId,
        cantidad: 3
      });
  });

  afterAll(async () => {
    await db.delete(coleccion).where(eq(coleccion.user_id, testUserId));
    await db.delete(carta).where(eq(carta.id, testCartaId));
    await db.delete(user).where(eq(user.id, testUserId));
  });
  
  it('debería devolver un 401 si no se envía token', async () => {
    const res = await request(app).get('/api/v1/coleccion/getColeccion');
    expect(res.status).toBe(401);;
  });

  it('debería devolver una respuesta con estado 200 y lista de cartas', async () => {
    const res = await request(app)
      .get('/api/v1/coleccion/getColeccion')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toMatchObject({
        id: expect.any(Number),
        nombre: expect.any(String),
        alias: expect.any(String),
        posicion: expect.any(String),
        equipo: expect.any(String),
        tipo_carta: expect.any(String),
        escudo: expect.any(String),
        pais: expect.any(String),
        photo: expect.any(String),
        defensa: expect.any(Number),
        control: expect.any(Number),
        ataque: expect.any(Number),
        cantidad: expect.any(Number),
        disponible: expect.any(Boolean),
        enVenta: expect.any(Boolean),
      });      
    }
  });
  
  it('debería devolver 401 con token inválido', async () => {
    const res = await request(app)
      .get('/api/v1/coleccion/getColeccion')
      .set('Authorization', 'Bearer token_invalido');
      
    expect(res.status).toBe(401);
  });
});
