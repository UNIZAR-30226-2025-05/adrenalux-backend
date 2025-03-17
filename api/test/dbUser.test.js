import { db } from '../config/db.js';
import { user } from '../db/schemas/user.js';
import { amistad } from '../db/schemas/amistad.js';
import { eq } from 'drizzle-orm';
import { agregarExp, calcularXpNecesaria } from '../lib/exp.js';
import { agregarMonedas, restarMonedas } from '../lib/monedas.js';
import { agregarPuntosClasificacion, restarPuntosClasificacion } from '../lib/puntosClasificacion.js';

let tx;

beforeAll(async () => {
  await db.delete(coleccion);
  await db.delete(amistad);
  await db.delete(user);
});


beforeEach(async () => {
  tx = await db.transaction(); 
});

afterEach(async () => {
  if (tx) {
    await tx.rollback();
  }
});
test('Insertar 3 usuarios en la BD', async () => {
  const usuarios = [
    {
      username: 'user1',
      email: 'user1@example.com',
      name: 'User',
      lastname: 'One',
      password: 'hashed_password',
      salt: 'random_salt',
      friend_code: 'FRIEND123',
    },
    {
      username: 'user2',
      email: 'user2@example.com',
      name: 'User',
      lastname: 'Two',
      password: 'hashed_password',
      salt: 'random_salt',
      friend_code: 'FRIEND456',
    },
    {
      username: 'user3',
      email: 'user3@example.com',
      name: 'User',
      lastname: 'Three',
      password: 'hashed_password',
      salt: 'random_salt',
      friend_code: 'FRIEND789',
    },
  ];

  await db.insert(user).values(usuarios);
  const insertedUsers = await db.select().from(user);
  expect(insertedUsers.length).toBe(3);
});

test('Actualizar el email de 2 usuarios y agregar experiencia, monedas y puntos de clasificación', async () => {
  // Actualizar email de los usuarios
  await db.update(user).set({ email: 'newemail1@example.com' }).where(eq(user.username, 'user1'));
  await db.update(user).set({ email: 'newemail2@example.com' }).where(eq(user.username, 'user2'));

  const [updatedUser1] = await db.select().from(user).where(eq(user.username, 'user1'));
  const [updatedUser2] = await db.select().from(user).where(eq(user.username, 'user2'));

  expect(updatedUser1.email).toBe('newemail1@example.com');
  expect(updatedUser2.email).toBe('newemail2@example.com');

  // Agregar experiencia
  const user1BeforeUpdate = updatedUser1.experience;
  await agregarExp(updatedUser1.id, 500);
  const [user1AfterUpdate] = await db.select().from(user).where(eq(user.username, 'user1'));
  expect(user1AfterUpdate.experience).toBe(user1BeforeUpdate + 500);

  const user2BeforeUpdate = updatedUser2.experience;
  await agregarExp(updatedUser2.id, 500);
  const [user2AfterUpdate] = await db.select().from(user).where(eq(user.username, 'user2'));
  expect(user2AfterUpdate.experience).toBe(user2BeforeUpdate + 500);

  // Agregar monedas
  await agregarMonedas(updatedUser1.id, 100);
  await agregarMonedas(updatedUser2.id, 100);

  // Agregar puntos de clasificación
  await agregarPuntosClasificacion(updatedUser1.id, 50);
  await agregarPuntosClasificacion(updatedUser2.id, 50);

  // Verificar valores después de la actualización
  const [user1After] = await db.select().from(user).where(eq(user.username, 'user1'));
  const [user2After] = await db.select().from(user).where(eq(user.username, 'user2'));

  expect(user1After.adrenacoins).toBeGreaterThanOrEqual(100);
  expect(user2After.adrenacoins).toBeGreaterThanOrEqual(100);
  expect(user1After.puntosClasificacion).toBeGreaterThanOrEqual(50);
  expect(user2After.puntosClasificacion).toBeGreaterThanOrEqual(50);
});

test('Restar monedas y puntos de clasificación', async () => {
  const [updatedUser1] = await db.select().from(user).where(eq(user.username, 'user1'));
  const [updatedUser2] = await db.select().from(user).where(eq(user.username, 'user2'));

  // Restar monedas
  await restarMonedas(updatedUser1.id, 50);
  await restarMonedas(updatedUser2.id, 50);

  // Restar puntos de clasificación
  await restarPuntosClasificacion(updatedUser1.id, 25);
  await restarPuntosClasificacion(updatedUser2.id, 25);

  const [user1AfterRestar] = await db.select().from(user).where(eq(user.username, 'user1'));
  const [user2AfterRestar] = await db.select().from(user).where(eq(user.username, 'user2'));

  expect(user1AfterRestar.adrenacoins).toBeGreaterThanOrEqual(50);
  expect(user2AfterRestar.adrenacoins).toBeGreaterThanOrEqual(50);
  expect(user1AfterRestar.puntosClasificacion).toBeGreaterThanOrEqual(25);
  expect(user2AfterRestar.puntosClasificacion).toBeGreaterThanOrEqual(25);
});

test('Restar monedas y puntos de clasificación y comprobar que no sea menor que 0', async () => {
  const [updatedUser1] = await db.select().from(user).where(eq(user.username, 'user1'));
  const [updatedUser2] = await db.select().from(user).where(eq(user.username, 'user2'));

  // Restar monedas hasta 0
  await restarMonedas(updatedUser1.id, 100);
  await restarMonedas(updatedUser2.id, 100);

  // Restar puntos de clasificación hasta 0
  await restarPuntosClasificacion(updatedUser1.id, 50);
  await restarPuntosClasificacion(updatedUser2.id, 50);

  const [user1AfterRestar] = await db.select().from(user).where(eq(user.username, 'user1'));
  const [user2AfterRestar] = await db.select().from(user).where(eq(user.username, 'user2'));

  expect(user1AfterRestar.adrenacoins).toBe(0);
  expect(user2AfterRestar.adrenacoins).toBe(0);
  expect(user1AfterRestar.puntosClasificacion).toBe(0);
  expect(user2AfterRestar.puntosClasificacion).toBe(0);
});

test('Eliminar un usuario', async () => {
  await db.delete(user).where(eq(user.username, 'user3'));

  const deletedUser = await db.select().from(user).where(eq(user.username, 'user3'));
  expect(deletedUser.length).toBe(0);
});

test('Crear amistad entre user1 y user2', async () => {
  const [user1] = await db.select({ id: user.id }).from(user).where(eq(user.username, 'user1'));
  const user1_id = user1.id;

  const [user2] = await db.select({ id: user.id }).from(user).where(eq(user.username, 'user2'));
  const user2_id = user2.id;

  await db.insert(amistad).values({
    user1_id,
    user2_id,
    estado: 'aceptada',
  });

  const [friendships] = await db.select().from(amistad);
  expect(friendships.length).toBe(1);
  expect(friendships[0].estado).toBe('aceptada');
});

afterAll(async () => {
  // Limpiar datos después de todas las pruebas
  await db.delete(amistad);
  await db.delete(user);
});
