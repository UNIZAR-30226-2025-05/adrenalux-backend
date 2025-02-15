import { pgTable, varchar, integer, boolean, text, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './user';
import { logro } from './logro';

export const logrosUsuario = pgTable(
  {
    user_id: varchar('user_id', { length: 50 }).notNull().references(() => user.id),
    logro_id: varchar('logro_id', { length: 50 }).notNull.references(() => logro.id),
    created_at: text('created_at').notNull().default(new Date().toISOString()),
    achieved: boolean('achieved').notNull().default(false),

  }
    ,(table) => ({
      compuesta: primaryKey({
        columns: [table.user_id, table.logro_id]
      })
    })
);
    

// Schemas para validaciones
export const logrosUsuarioSelectSchema = createSelectSchema(logrosUsuario).partial();
export const logrosUsuarioInsertSchema = createInsertSchema(logrosUsuario).partial();

export const schema = {
  user,
  logro,
};
