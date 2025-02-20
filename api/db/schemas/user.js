import { pgTable, varchar, serial, text, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

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
  password: text('password')
    .notNull(),
  salt: text('salt')  
    .notNull(),
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
  avatar: text('avatar').default('../imagenes/profile/avatarDefault.png'),
  created_at: text('created_at')
    .notNull()
    .default(new Date().toISOString()),
});

export const userSelectSchema = createSelectSchema(user).partial();
export const userInsertSchema = createInsertSchema(user).partial();

export const schema = {
  user,
};

