import { pgTable, varchar, serial, text, integer, timestamp  } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { plantilla } from './plantilla.js';

 // export const DEFAULT_AVATAR_URL = '../imagenes/profile/avatarDefault.png';
export const user = pgTable('user', {
  id: serial('id')
    .primaryKey(),
  username: varchar('username', { length: 50 })
    .notNull()
    .unique(),
  email: varchar('email', { length: 50 })
    .notNull()
    .unique(),
  name: varchar('name', { length: 100 })
    .notNull(),
  lastname: varchar('lastname', { length: 100 })
    .notNull(),
  password: text('password'),
  salt: text('salt'),
  friend_code: varchar('friend_code', { length: 10 })
    .notNull()
    .unique(),
  adrenacoins: integer('adrenacoins')
    .notNull()
    .default(0),
  experience: integer('experience')
    .notNull()
    .default(0),
  level: integer('level')
    .notNull()
    .default(1),
  puntosClasificacion: integer('puntosClasificacion')
    .notNull()
    .default(0),
  avatar: text('avatar').default('assets/default_profile.jpg'),
  created_at: text('created_at')
    .notNull()
    .default(new Date().toISOString()),
  plantilla_activa_id: integer('plantilla_activa_id')
    .references(() => plantilla.id),
  ultimo_sobre_gratis: timestamp('ultimo_sobre_gratis'),
  google_id: varchar('google_id', { length: 255 }).unique(),
});

export const userSelectSchema = createSelectSchema(user).partial();
export const userInsertSchema = createInsertSchema(user).partial();

export const schema = {
  user,
};

