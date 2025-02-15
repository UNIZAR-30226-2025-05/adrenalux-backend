import { pgTable, integer, foreignKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './user.js';
import { carta } from './carta.js';

export const coleccion = pgTable(
  {
  id: serial('id').primaryKey(), 
  carta_id: integer('carta_id')
    .references(() => carta.id) 
    .notNull(),
  id_usuario: varchar('id_user', { length: 50 })
    .references(() => user.id) 
    .notNull(),
  cantidad: integer('cantidad').notNull().default(0),
});

export const coleccionSelectSchema = createSelectSchema(coleccion).partial();
export const coleccionInsertSchema = createInsertSchema(coleccion).partial();

export const schema = {
  coleccion,
};