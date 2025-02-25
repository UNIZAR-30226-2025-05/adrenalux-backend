import { db } from '../config/db.js';
import { user } from '../db/schemas/user.js';
import { carta } from '../db/schemas/carta.js';
import { coleccion } from '../db/schemas/coleccion.js';
import { TIPOS_CARTAS } from '../config/cartas.config.js';
import { eq } from 'drizzle-orm';

beforeAll(async () => {
  await db.delete(coleccion);
  await db.delete(carta); 
  await db.delete(user); 

  // Insertar un usuario y algunas cartas para las pruebas
  await db.insert(user).values({
    username: 'user1',
    email: 'user1@example.com',
    name: 'User',
    lastname: 'One',
    password: 'hashed_password',
    salt: 'random_salt',
    friend_code: 'FRIEND123',
  });

  const cartas = [
    {
      nombre: 'Jugador 1',
      alias: 'Alias 1',
      posicion: 'Forward',
      equipo: 'Equipo 1',
      tipo_carta: TIPOS_CARTAS.NORMAL.nombre,
      escudo: 'escudo1.png',
      pais: 'País 1',
      photo: 'photo1.png',
      defensa: 50,
      control: 60,
      ataque: 70,
    },
    {
      nombre: 'Jugador 2',
      alias: 'Alias 2',
      posicion: 'Midfielder',
      equipo: 'Equipo 2',
      tipo_carta: TIPOS_CARTAS.NORMAL.nombre,
      escudo: 'escudo2.png',
      pais: 'País 2',
      photo: 'photo2.png',
      defensa: 55,
      control: 65,
      ataque: 75,
    },
    {
      nombre: 'Jugador 3',
      alias: 'Alias 3',
      posicion: 'Defender',
      equipo: 'Equipo 3',
      tipo_carta: TIPOS_CARTAS.NORMAL.nombre,
      escudo: 'escudo3.png',
      pais: 'País 3',
      photo: 'photo3.png',
      defensa: 60,
      control: 70,
      ataque: 80,
    },
  ];

  await db.insert(carta).values(cartas);
});

test('Insertar varias cartas en la BD', async () => {
  const insertedCartas = await db.select().from(carta);
  expect(insertedCartas.length).toBe(3);
});

test('Actualizar el equipo y tipo de carta de una carta', async () => {
  await db.update(carta).set({ equipo: 'Nuevo Equipo', tipo_carta: TIPOS_CARTAS.LUXURY.nombre }).where(eq(carta.nombre, 'Jugador 1'));

  const updatedCarta = await db.select().from(carta).where(eq(carta.nombre, 'Jugador 1'));

  expect(updatedCarta[0].equipo).toBe('Nuevo Equipo');
  expect(updatedCarta[0].tipo_carta).toBe(TIPOS_CARTAS.LUXURY.nombre);
});

test('Eliminar una carta', async () => {
  await db.delete(carta).where(eq(carta.nombre, 'Jugador 3'));

  const deletedCarta = await db.select().from(carta).where(eq(carta.nombre, 'Jugador 3'));
  expect(deletedCarta.length).toBe(0);
});

test('Agregar cartas a la colección de un usuario', async () => {
  const user1 = await db.select().from(user).where(eq(user.username, 'user1'));
  const carta1 = await db.select().from(carta).where(eq(carta.nombre, 'Jugador 1'));
  const carta2 = await db.select().from(carta).where(eq(carta.nombre, 'Jugador 2'));

  await db.insert(coleccion).values({
    user_id: user1[0].id,
    carta_id: carta1[0].id,
    cantidad: 1,
  });

  await db.insert(coleccion).values({
    user_id: user1[0].id,
    carta_id: carta2[0].id,
    cantidad: 1,
  });

  const coleccionUser1 = await db.select().from(coleccion).where(eq(coleccion.user_id, user1[0].id));
  expect(coleccionUser1.length).toBe(2);
});

test('Actualizar la cantidad de cartas en la colección', async () => {
  const user1 = await db.select().from(user).where(eq(user.username, 'user1'));
  const carta1 = await db.select().from(carta).where(eq(carta.nombre, 'Jugador 1'));

  await db.update(coleccion).set({ cantidad: 2 }).where(eq(coleccion.user_id, user1[0].id)).andWhere(eq(coleccion.carta_id, carta1[0].id));

  const updatedColeccion = await db.select().from(coleccion).where(eq(coleccion.user_id, user1[0].id)).andWhere(eq(coleccion.carta_id, carta1[0].id));
  expect(updatedColeccion[0].cantidad).toBe(2);
});

test('Eliminar cartas de la colección', async () => {
  const user1 = await db.select().from(user).where(eq(user.username, 'user1'));
  const carta1 = await db.select().from(carta).where(eq(carta.nombre, 'Jugador 1'));

  await db.update(coleccion).set({ cantidad: 1 }).where(eq(coleccion.user_id, user1[0].id)).andWhere(eq(coleccion.carta_id, carta1[0].id));

  const updatedColeccion = await db.select().from(coleccion).where(eq(coleccion.user_id, user1[0].id)).andWhere(eq(coleccion.carta_id, carta1[0].id));
  expect(updatedColeccion[0].cantidad).toBe(1);

  await db.delete(coleccion).where(eq(coleccion.user_id, user1[0].id)).andWhere(eq(coleccion.carta_id, carta1[0].id));

  const deletedColeccion = await db.select().from(coleccion).where(eq(coleccion.user_id, user1[0].id)).andWhere(eq(coleccion.carta_id, carta1[0].id));
  expect(deletedColeccion.length).toBe(0);
});