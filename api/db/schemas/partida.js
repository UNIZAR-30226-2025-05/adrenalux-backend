import { pgTable, integer, varchar, text, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './user';

export const partida = pgTable('partida', {
  id: serial('id').primaryKey(), 
  turno: integer('turno')
    .notNull(),
  estado: varchar('estado', { length: 20 })
    .notNull()
    .default('parada'), 
  ganador_id: varchar('ganador_id', { length: 50 }), 
  fecha: text('fecha').notNull()
    .default(new Date()
    .toISOString()), 
  id_user1: varchar('usuario1', { length: 50 })
    .notNull()
    .references(() => user.id), // Usuario local
  id_user2: varchar('usuario2', { length: 50 })
    .notNull()
    .references(() => user.id), // Usuario visitante
  torneo_id: integer('torneo_id')
    .references(() => torneos.id), // Clave ajena del torneo (opcional si la partida es parte de un torneo)

});

export const partidaSelectSchema = createSelectSchema(partida).partial();
export const partidaInsertSchema = createInsertSchema(partida).partial();

export const schema = {
  partida,
};
