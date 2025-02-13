import { pgTable, varchar, integer, boolean, text, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const logrosUsuario = pgTable('logrosUsuario', {
  user_id: varchar('user_id', { length: 50 }).notNull(),
  logro_id: varchar('logro_id', { length: 50 }).notNull(),
  created_at: text('created_at').notNull().default(new Date().toISOString()),
  achieved: boolean('achieved').notNull().default(false),

  user1: foreignKey('user1_id').references(users.username),
  logro_id: foreignKey('logro_id').references(logro.user_id),

  primaryKey: pgTable.primaryKey('user1_id', 'logro_id')
});

// Schemas para validaciones
export const logrosUsuarioSelectSchema = createSelectSchema(logrosUsuario).partial();
export const logrosUsuarioInsertSchema = createInsertSchema(logrosUsuario).partial();

export const schema = {
  logrosUsuario,
};
