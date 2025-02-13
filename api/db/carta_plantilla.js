import { pgTable, foreignKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Tabla intermedia entre cartas y plantillas
export const carta_plantilla = pgTable('carta_plantilla', {
  carta_id: foreignKey('carta_id').references(cartas.id).notNull(), // Relación con carta
  plantilla_id: foreignKey('plantilla_id').references(plantilla.id).notNull(), // Relación con plantilla
});

// Esquemas para insertar y seleccionar
export const cartaPlantillaSelectSchema = createSelectSchema(carta_plantilla).partial();
export const cartaPlantillaInsertSchema = createInsertSchema(carta_plantilla).partial();

export const schema = {
  carta_plantilla,
};
