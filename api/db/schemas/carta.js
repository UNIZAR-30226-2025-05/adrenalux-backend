import { pgTable, varchar, integer, text, serial } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Tabla de cartas
export const carta = pgTable( 
  'carta', 
  {
    id: serial('id').primaryKey(), 
    nombre: varchar('nombre', { length: 50 }).notNull(),
    alias: varchar('alias', { length: 50 }).notNull(),
    posicion: varchar('posicion', { length: 50 }).notNull(),
    equipo: varchar('equipo', { length: 50 }).notNull(),
    tipo_carta : varchar('tipo_carta', { length: 50 }).notNull(),
    escudo: text('escudo').notNull(),
    pais: varchar('pais', { length: 50 }).notNull(),
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
