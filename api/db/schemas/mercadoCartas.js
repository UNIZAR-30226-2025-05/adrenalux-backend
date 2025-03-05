import { pgTable, serial, integer, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { carta } from './carta.js';  // Importamos la tabla carta
import { usuario } from './usuario.js'; // Importamos la tabla usuario

// Tabla Mercado Cartas (Sistema de pujas)
export const mercadoCartas = pgTable('mercado_cartas', {
    id: serial('id').primaryKey(),
    cartaId: integer('carta_id').notNull().references(() => carta.id, { onDelete: 'cascade' }),
    vendedorId: integer('vendedor_id').notNull().references(() => usuario.id, { onDelete: 'cascade' }),
    compradorId: integer('comprador_id').references(() => usuario.id, { onDelete: 'set null' }),
    precio: integer('precio').notNull(),
    estado: varchar('estado', { length: 20 }).notNull().default('A la venta'),
    fechaPublicacion: timestamp('fecha_publicacion').notNull().defaultNow(),
    fechaVenta: timestamp('fecha_venta'),
  });

export const mercadoCartasSelectSchema = createSelectSchema(mercadoCartas).partial();
export const mercadoCartasInsertSchema = createInsertSchema(mercadoCartas).partial();

export const schema = {
    mercadoCartas,
  };