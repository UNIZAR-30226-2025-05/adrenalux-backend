import { pgTable, integer, varchar, text, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const partida = pgTable('partida', {
  // Atributos de la tabla
  id: integer('id').primaryKey().autoIncrement(), 
  turno: integer('turno').notNull(),
  estado: varchar('estado', { length: 20 }).notNull().default('parada'), 
  ganador_id: varchar('ganador_id', { length: 50 }), 
  fecha: text('fecha').notNull().default(new Date().toISOString()), 
  usuario1: varchar('usuario1', { length: 50 }).notNull().references(() => users.username), // Usuario local
  usuario2: varchar('usuario2', { length: 50 }).notNull().references(() => users.username), // Usuario visitante
  torneo_id: integer('torneo_id').references(() => torneos.id), // Clave ajena del torneo (opcional si la partida es parte de un torneo)

});

export const partidaSelectSchema = createSelectSchema(partida).partial();
export const partidaInsertSchema = createInsertSchema(partida).partial();

export const schema = {
  partida,
};
