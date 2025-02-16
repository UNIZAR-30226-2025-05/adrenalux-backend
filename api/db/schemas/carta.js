import { pgTable, varchar, integer, text, serial } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Tabla de cartas
export const carta = pgTable( 
  'carta', // Nombre de la tabla
  {
    id: serial('id').primaryKey(), // Clave primaria auto-incrementable
    nombre: varchar('nombre', { length: 25 }).notNull(),
    equipo: varchar('equipo', { length: 25 }).notNull(),
    pais: varchar('pais', { length: 25 }).notNull(),
    photo: text('photo').notNull(),
    defensa: integer('defensa').notNull(),
    control: integer('control').notNull(),
    ataque: integer('ataque').notNull(),
  }
);

export const cartaSelectSchema = createSelectSchema(carta).partial();
export const cartaInsertSchema = createInsertSchema(carta).partial();

export const schema = {
  carta,
};
