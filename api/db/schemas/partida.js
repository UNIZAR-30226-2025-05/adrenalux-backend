import { pgTable, integer, varchar, text, serial } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './user';
import { torneo } from './torneo';

export const partida = pgTable('partida', {
  id: serial('id').primaryKey(), 
  turno: integer('turno')
    .notNull(),
  estado: varchar('estado', { length: 20 })
    .notNull()
    .default('parada'), 
  ganador_id: integer('ganador_id', { length: 50 }), 
  fecha: text('fecha').notNull()
    .default(new Date()
    .toISOString()), 
  id_user1: integer('usuario1', { length: 50 })
    .notNull()
    .references(() => user.id), // Usuario local
  id_user2: integer('usuario2', { length: 50 })
    .notNull()
    .references(() => user.id), // Usuario visitante
  torneo_id: integer('torneo_id')
    .references(() => torneo.id), 
});

export const partidaSelectSchema = createSelectSchema(partida).partial();
export const partidaInsertSchema = createInsertSchema(partida).partial();

export const schema = {
  partida,
};
