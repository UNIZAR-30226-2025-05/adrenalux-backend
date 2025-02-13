import { pgTable, varchar, integer, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Tabla de plantillas
export const plantilla = pgTable('plantilla', {
  id: integer('id').primaryKey().autoincrement(), // Clave primaria
  username: varchar('username', { length: 50 }).notNull(), // Clave ajena (usuario al que le pertenece la plantilla)
  nombre: varchar('nombre', { length: 100 }).notNull(), // Nombre de la plantilla
});

// Esquemas para insertar y seleccionar
export const plantillaSelectSchema = createSelectSchema(plantilla).partial();
export const plantillaInsertSchema = createInsertSchema(plantilla).partial();

export const schema = {
  plantilla,
};
