import { pgTable, integer, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { carta } from './carta.js';
import { plantilla } from './plantilla.js';

export const carta_plantilla = pgTable('carta_plantilla', {
  carta_id: integer('carta_id')
    .notNull()
    .references(() => carta.id), 
  plantilla_id: integer('plantilla_id')
    .notNull()
    .references(() => plantilla.id),
}, (table) =>[
  primaryKey({
    columns: [table.carta_id, table.plantilla_id],
  }),
]);

// Esquemas para insertar y seleccionar utilizando Zod
export const cartaPlantillaSelectSchema = createSelectSchema(carta_plantilla).partial();
export const cartaPlantillaInsertSchema = createInsertSchema(carta_plantilla).partial();

export const schema = {
  carta,
  plantilla,
};
