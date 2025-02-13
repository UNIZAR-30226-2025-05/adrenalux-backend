import { pgTable, varchar, integer, foreignKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const amistad = pgTable('amistad', {
  user1_id: varchar('user1_id', { length: 50 }).notNull(),
  user2_id: varchar('user2_id', { length: 50 }).notNull(),
  created_at: text('created_at').notNull().default(new Date().toISOString()),
  
  user1: foreignKey('user1_id').references(users.username),
  user2: foreignKey('user2_id').references(users.username),

  primaryKey: pgTable.primaryKey('user1_id', 'user2_id')
});

// Esquemas para insertar y seleccionar
export const amistadSelectSchema = createSelectSchema(amistad).partial();
export const amistadInsertSchema = createInsertSchema(amistad).partial();

export const schema = {
  users,
  amistad,
};
