import { pgTable, varchar, integer, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Tabla de cartas
export const carta = pgTable('cartas', {
  id: integer('id').primaryKey().autoincrement(), // Clave primaria y auto-incrementable
  nombre: varchar('nombre', { length: 100 }).notNull(),
  equipo: varchar('equipo', { length: 100 }).notNull(),
  pais: varchar('pais', { length: 100 }).notNull(),
  defensa: integer('defensa').notNull(),
  control: integer('control').notNull(),
  ataque: integer('ataque').notNull(),
});

// Esquemas para insertar y seleccionar
export const cartaSelectSchema = createSelectSchema(carta).partial();
export const cartaInsertSchema = createInsertSchema(carta).partial();

export const schema = {
  carta,
};
