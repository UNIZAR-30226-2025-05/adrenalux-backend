import { pgTable, integer, serial } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './user.js';
import { carta } from './carta.js';

export const coleccion = pgTable('coleccion',
  {
  id: serial('id').primaryKey(), 
  carta_id: integer('carta_id')
    .references(() => carta.id) 
    .notNull(),
  user_id: integer('user_id')
    .references(() => user.id, { onDelete: 'CASCADE' }) 
    .notNull(),
  cantidad: integer('cantidad').notNull().default(0),
});

export const coleccionSelectSchema = createSelectSchema(coleccion).partial();
export const coleccionInsertSchema = createInsertSchema(coleccion).partial();

export const schema = {
  coleccion,
};