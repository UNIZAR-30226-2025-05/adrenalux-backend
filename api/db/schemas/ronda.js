import { pgTable, integer, varchar, serial } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './user.js';
import { partida } from './partida.js';
import { carta } from './carta.js';

export const ronda = pgTable('ronda', {
    id: serial('id').primaryKey(),
    partida_id: integer('partida_id')
        .references(() => partida.id) 
        .notNull(),
    numero_ronda: integer('numero_ronda').notNull(),
    carta_j1: integer('carta_j1')
        .references(() => carta.id) 
        .notNull(),
    carta_j2: integer('carta_j2')
    .references(() => carta.id) 
    .notNull(),
    habilidad_j1: varchar('habilidad_j1'), 
    habilidad_j2: varchar('habilidad_j2'),
    ganador_id: integer('ganador_id')
    .references(() => user.id),
  });

  export const rondaSelectSchema = createSelectSchema(ronda).partial();
  export const rondaInsertSchema = createInsertSchema(ronda).partial();
  
  export const schema = {
    ronda,
  };