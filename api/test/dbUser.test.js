import { db } from '../config/db.js';
import { user } from '../db/schemas/user.js';
import { amistad } from '../db/schemas/amistad.js';
import { eq } from 'drizzle-orm';
import { agregarExp, calcularXpNecesaria } from '../lib/exp.js';
import { agregarMonedas, restarMonedas } from '../lib/monedas.js';
import { agregarPuntosClasificacion, restarPuntosClasificacion } from '../lib/puntosClasificacion.js';

beforeAll(async () => {
  await db.delete(amistad); // Limpiar amistades primero por dependencias
  await db.delete(user); // Limpiar usuarios antes de comenzar
});

test('Insertar 3 usuarios en la BD', async () => {
  const users = [
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

  await db.insert(user).values(users);
  const insertedUsers = await db.select().from(user);
  expect(insertedUsers.length).toBe(3);
});


test('Actualizar el email de 2 usuarios y agregar experiencia, monedas y puntos de clasificación', async () => {
  await db.update(user).set({ email: 'newemail1@example.com' }).where(eq(user.username, 'user1'));
  await db.update(user).set({ email: 'newemail2@example.com' }).where(eq(user.username, 'user2'));

  const updatedUser1 = await db.select().from(user).where(eq(user.username, 'user1'));
  const updatedUser2 = await db.select().from(user).where(eq(user.username, 'user2'));

  expect(updatedUser1[0].email).toBe('newemail1@example.com');
  expect(updatedUser2[0].email).toBe('newemail2@example.com');


  await agregarExp(updatedUser1[0].id, 500);
  await agregarExp(updatedUser2[0].id, 500);

  await agregarMonedas(updatedUser1[0].id, 100);
  await agregarMonedas(updatedUser2[0].id, 100);

  await agregarPuntosClasificacion(updatedUser1[0].id, 50);
  await agregarPuntosClasificacion(updatedUser2[0].id, 50);

  const user1AfterUpdates = await db.select().from(user).where(eq(user.username, 'user1'));
  const user2AfterUpdates = await db.select().from(user).where(eq(user.username, 'user2'));

  expect(user1AfterUpdates[0].experience).toBeGreaterThanOrEqual(500);
  expect(user2AfterUpdates[0].experience).toBeGreaterThanOrEqual(500);
  expect(user1AfterUpdates[0].adrenacoins).toBeGreaterThanOrEqual(100);
  expect(user2AfterUpdates[0].adrenacoins).toBeGreaterThanOrEqual(100);
  expect(user1AfterUpdates[0].puntosClasificacion).toBeGreaterThanOrEqual(50);
  expect(user2AfterUpdates[0].puntosClasificacion).toBeGreaterThanOrEqual(50);
});

test('Restar monedas y puntos de clasificación', async () => {
  const updatedUser1 = await db.select().from(user).where(eq(user.username, 'user1'));
  const updatedUser2 = await db.select().from(user).where(eq(user.username, 'user2'));

  // Restar monedas
  await restarMonedas(updatedUser1[0].id, 50);
  await restarMonedas(updatedUser2[0].id, 50);

  // Restar puntos de clasificación
  await restarPuntosClasificacion(updatedUser1[0].id, 25);
  await restarPuntosClasificacion(updatedUser2[0].id, 25);

  const user1AfterRestar = await db.select().from(user).where(eq(user.username, 'user1'));
  const user2AfterRestar = await db.select().from(user).where(eq(user.username, 'user2'));

  expect(user1AfterRestar[0].adrenacoins).toBeGreaterThanOrEqual(50);
  expect(user2AfterRestar[0].adrenacoins).toBeGreaterThanOrEqual(50);
  expect(user1AfterRestar[0].puntosClasificacion).toBeGreaterThanOrEqual(25);
  expect(user2AfterRestar[0].puntosClasificacion).toBeGreaterThanOrEqual(25);
});

test('Restar monedas y puntos de clasificación y comprobar q no sea menor que 0', async () => {
  const updatedUser1 = await db.select().from(user).where(eq(user.username, 'user1'));
  const updatedUser2 = await db.select().from(user).where(eq(user.username, 'user2'));

  // Restar monedas hasta 0
  await restarMonedas(updatedUser1[0].id, 100);
  await restarMonedas(updatedUser2[0].id, 100);

  // Restar puntos de clasificación hasta 0
  await restarPuntosClasificacion(updatedUser1[0].id, 50);
  await restarPuntosClasificacion(updatedUser2[0].id, 50);

  const user1AfterRestar = await db.select().from(user).where(eq(user.username, 'user1'));
  const user2AfterRestar = await db.select().from(user).where(eq(user.username, 'user2'));

  expect(user1AfterRestar[0].adrenacoins).toBe(0);
  expect(user2AfterRestar[0].adrenacoins).toBe(0);
  expect(user1AfterRestar[0].puntosClasificacion).toBe(0);
  expect(user2AfterRestar[0].puntosClasificacion).toBe(0);
});

test('Eliminar un usuario', async () => {
  await db.delete(user).where(eq(user.username, 'user3'));

  const deletedUser = await db.select().from(user).where(eq(user.username, 'user3'));
  expect(deletedUser.length).toBe(0);
});

test('Crear amistad entre user1 y user2', async () => {
  const users = await db.select({ id: user.id }).from(user).where(eq(user.username, 'user1'));
  const user1_id = users[0].id;

  const users2 = await db.select({ id: user.id }).from(user).where(eq(user.username, 'user2'));
  const user2_id = users2[0].id;

  await db.insert(amistad).values({
    user1_id,
    user2_id,
    estado: 'aceptada',
  });

  const friendships = await db.select().from(amistad);
  expect(friendships.length).toBe(1);
  expect(friendships[0].estado).toBe('aceptada');
});