import { pgTable, foreignKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { carta } from './carta.js';
import { plantilla } from './plantilla.js';

// Tabla intermedia entre cartas y plantillas
export const carta_plantilla = pgTable(
  {
    carta_id: foreignKey('carta_id')
      .notNull()
      .references(() => cartas.id), // Relación con carta
    plantilla_id: foreignKey('plantilla_id')
    .notNull()
    .references(() => plantilla.id), // Relación con plantilla
  },
  (table) => ({
    compuesta: primaryKey({
      columns: [table.carta_id, table.plantilla_id]
    })
  })
);

export const cartaPlantillaSelectSchema = createSelectSchema(carta_plantilla).partial();
export const cartaPlantillaInsertSchema = createInsertSchema(carta_plantilla).partial();

export const schema = {
  carta,
  plantilla,
};
