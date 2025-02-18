import { pgTable, boolean, timestamp,integer, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './user';
import { logro } from './logro';

export const logrosUsuario = pgTable('logrosUsuario', {
  user_id: integer('user_id').notNull().references(() => user.id),
  logro_id: integer('logro_id').notNull().references(() => logro.id),
  created_at: timestamp('created_at').notNull().defaultNow(),
  achieved: boolean('achieved').notNull().default(false),
}, (table) => [
  primaryKey({ columns: [table.user_id, table.logro_id] })
]);

// Schemas para validaciones
export const logrosUsuarioSelectSchema = createSelectSchema(logrosUsuario).partial();
export const logrosUsuarioInsertSchema = createInsertSchema(logrosUsuario).partial();

export const schema = {
  user,
  logro,
};
