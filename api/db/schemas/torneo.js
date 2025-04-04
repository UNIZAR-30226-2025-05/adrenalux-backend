import { pgTable, integer, varchar, text, serial } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './user.js';
import { boolean } from 'drizzle-orm/pg-core';

export const torneo = pgTable('torneo', {
  id: serial('id').primaryKey(),
  creador_id: integer('creador_id')
    .notNull()
    .references(() => user.id),
  nombre: varchar('nombre', { length: 100 })
    .notNull(), 
  contrasena: varchar('contrasena', { length: 100 }), 
  ganador_id: varchar('ganador_id', { length: 50 }), 
  premio: integer('premio').notNull(), 
  descripcion: text('descripcion').notNull(),
  fecha_inicio: text('fecha_inicio').notNull(),
  torneo_en_curso: boolean('torneo_en_curso').notNull().default(false),
});

// Schemas para validaciones
export const torneoSelectSchema = createSelectSchema(torneo).partial();
export const torneoInsertSchema = createInsertSchema(torneo).partial();

export const schema = {
  torneo,
};
