import { pgTable, varchar, text, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const users = pgTable('users', {
  username: varchar('username', { length: 50 }).primaryKey(), 
  email: varchar('email', { length: 255 }).notNull().unique(), 
  name: varchar('name', { length: 100 }).notNull(), 
  lastname: varchar('lastname', { length: 100 }).notNull(),
  password: text('password').notNull(), 
  friend_code: varchar('friend_code', { length: 10 }).notNull().unique(), 
  adrenacoins: integer('adrenacoins').notNull().default(0),
  experience: integer('experience').notNull().default(0), 
  level: integer('level').notNull().default(1), 
  avatar: text('avatar'), 
  created_at: text('created_at').notNull().default(new Date().toISOString()), 
});

export const usersSelectSchema = createSelectSchema(users).partial();
export const usersInsertSchema = createInsertSchema(users).partial();

export const schema = {
  users,
};
