import { pgTable, serial, integer, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { carta } from './carta.js';  
import { user } from './user.js'; 

export const cartaState = { 
  EN_VENTA : 'En venta', 
  VENDIDA : 'Vendida',
};

// Tabla Mercado Cartas (Sistema de pujas)
export const mercadoCartas = pgTable('mercado_cartas', {
    id: serial('id').primaryKey(),
    cartaId: integer('carta_id').notNull().references(() => carta.id, { onDelete: 'cascade' }),
    vendedorId: integer('vendedor_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    compradorId: integer('comprador_id').references(() => user.id, { onDelete: 'set null' }),
    precio: integer('precio').notNull(),
    estado: varchar('estado', { length: 20 }).notNull().default(cartaState.EN_VENTA),
    fechaPublicacion: timestamp('fecha_publicacion').notNull().defaultNow(),
    fechaVenta: timestamp('fecha_venta'),
  });

  // Tabla Mercado Diario
export const mercadoDiario = pgTable('mercado_diario', {
    id: serial('id').primaryKey(),
    cartaId: integer('carta_id').notNull().references(() => carta.id, { onDelete: 'cascade' }),
    precio: integer('precio').notNull(),
    fechaDisponible: timestamp('fecha_disponible').notNull().defaultNow(),
    vendida: boolean('vendida').notNull().default(false),
  });
  
  
export const mercadoCartasSelectSchema = createSelectSchema(mercadoCartas).partial();
export const mercadoCartasInsertSchema = createInsertSchema(mercadoCartas).partial();
export const mercadoDiarioSelectSchema = createSelectSchema(mercadoDiario).partial();
export const mercadoDiarioInsertSchema = createInsertSchema(mercadoDiario).partial();

export const schema = {
    mercadoCartas,
    mercadoDiario,
  };