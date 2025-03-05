import { pgTable, serial, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { carta } from './carta.js';  // Importamos la tabla carta


// Tabla Mercado Diario
export const mercadoDiario = pgTable('mercado_diario', {
  id: serial('id').primaryKey(),
  cartaId: integer('carta_id').notNull().references(() => carta.id, { onDelete: 'cascade' }),
  precio: integer('precio').notNull(),
  fechaDisponible: timestamp('fecha_disponible').notNull(),
  vendida: boolean('vendida').notNull().default(false),
});

export const mercadoDiarioSelectSchema = createSelectSchema(mercadoDiario).partial();
export const mercadoDiarioInsertSchema = createInsertSchema(mercadoDiario).partial();

export const schema = {
    mercadoDiario,
  };