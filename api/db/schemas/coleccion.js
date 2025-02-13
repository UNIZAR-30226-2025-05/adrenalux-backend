import { pgTable, integer, foreignKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Tabla de colecciones
export const coleccion = pgTable('coleccion', {
  id: integer('id').primaryKey().autoincrement(), // Clave primaria
  carta_id: foreignKey('carta_id').references(cartas.id).notNull(), // Relación con carta
  username: foreignKey('username').references(users.username).notNull(), // Relación con usuario
  
  // Número de veces que la carta está repetida en la colección
  cantidad: integer('cantidad').notNull().default(1), // Número de cartas repetidas en la colección
});

// Esquemas para insertar y seleccionar
export const coleccionSelectSchema = createSelectSchema(coleccion).partial();
export const coleccionInsertSchema = createInsertSchema(coleccion).partial();

export const schema = {
  coleccion,
};
