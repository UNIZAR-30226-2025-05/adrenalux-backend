import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Definición de la tabla 'users'
// PK = username
export const users = pgTable('users', {
  username: varchar('username', { length: 50 }).primaryKey(), 
  email: varchar('email', { length: 255 }).notNull().unique(), 
  name: varchar('name', { length: 100 }).notNull(), 
  password: text('password').notNull(), 
  favorite_team: varchar('favorite_team', { length: 100 }),
  avatar: text('avatar'), 
  created_at: text('created_at').notNull().default(new Date().toISOString()),
});

export const usersSelectSchema = createSelectSchema(users).partial();
export const usersInsertSchema = createInsertSchema(users).partial();

export const schema = {
  users,
};
