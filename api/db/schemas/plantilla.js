import { pgTable, varchar, integer, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './user.js';

// Tabla de plantillas
export const plantilla = pgTable('plantilla', {
  id: integer('id')
    .primaryKey()
    .autoincrement(), // Clave primaria
  user_id: varchar('username', { length: 50 }).notNull().references(() => user.id),
  nombre: varchar('nombre', { length: 100 }).notNull(), // Nombre de la plantilla
});

// Esquemas para insertar y seleccionar
export const plantillaSelectSchema = createSelectSchema(plantilla).partial();
export const plantillaInsertSchema = createInsertSchema(plantilla).partial();

export const schema = {
  plantilla,
};
