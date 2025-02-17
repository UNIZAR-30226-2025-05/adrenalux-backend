import { pgTable, integer, varchar, serial } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './user.js';

export const plantilla = pgTable('plantilla', {
  id: serial('id').primaryKey(), 
  user_id: integer('username').notNull().references(() => user.id),
  nombre: varchar('nombre', { length: 100 }).notNull(), 
});

// Esquemas para insertar y seleccionar
export const plantillaSelectSchema = createSelectSchema(plantilla).partial();
export const plantillaInsertSchema = createInsertSchema(plantilla).partial();

export const schema = {
  plantilla,
};
