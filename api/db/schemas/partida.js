import { pgTable, integer, varchar, text, serial } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './user.js';
import { torneo } from './torneo.js';
import { plantilla } from './plantilla.js';

export const partida = pgTable('partida', {
  id: serial('id').primaryKey(), 
  turno: integer('turno')
    .notNull(),
  estado: varchar('estado', { length: 20 })
    .notNull()
    .default('parada'), 
  puntuacion1: integer('puntuacion1').default(0),
  puntuacion2: integer('puntuacion2').default(0),
  ganador_id: integer('ganador_id', { length: 50 }), 
  fecha: text('fecha').notNull()
    .default(new Date()
    .toISOString()), 
  user1_id: integer('usuario1')
    .notNull()
    .references(() => user.id),
  user2_id: integer('usuario2')
    .notNull()
    .references(() => plantilla.id),
  plantilla1_id: integer('plantilla1')
    .notNull()
    .references(() => plantilla.id),
  plantilla2_id: integer('plantilla2')
    .notNull()
    .references(() => plantilla.id),
  torneo_id: integer('torneo_id')
    .references(() => torneo.id), 
});

export const partidaSelectSchema = createSelectSchema(partida).partial();
export const partidaInsertSchema = createInsertSchema(partida).partial();

export const schema = {
  partida,
};
