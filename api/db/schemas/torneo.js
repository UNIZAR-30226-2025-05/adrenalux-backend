import { pgTable, integer, varchar, text, primaryKey, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const torneo = pgTable('torneo', {
  id: integer('id')
    .primaryKey()
    .autoIncrement(),
  nombre: varchar('nombre', { length: 100 })
    .notNull(), 
  contrasena: varchar('contrasena', { length: 100 }), 
  ganador_id: varchar('ganador_id', { length: 50 }), 
  premio: integer('premio').notNull(), 
  descripcion: text('descripcion').notNull(), 
});

// Schemas para validaciones
export const torneoSelectSchema = createSelectSchema(torneo).partial();
export const torneoInsertSchema = createInsertSchema(torneo).partial();

export const schema = {
  torneo,
};
