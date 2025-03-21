import { text, varchar,integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './user.js';

export const amistad = pgTable('amistad', {
  user1_id: integer('user1_id')
    .notNull()
    .references(() => user.id),
  user2_id: integer('user2_id')
    .notNull()
    .references(() => user.id),
    estado: varchar('estado', { length: 10 })
    .notNull(), // Valores posibles: 'pendiente', 'aceptada', 'rechazada'
  created_at: text('created_at')
    .notNull()
    .default(new Date().toISOString()),
}, (table) => [
  primaryKey({
    columns: [table.user1_id, table.user2_id], 
  }),
]);

export const amistadSelectSchema = createSelectSchema(amistad).partial();
export const amistadInsertSchema = createInsertSchema(amistad).partial();

export const schema = {
  user,
  amistad,
};
