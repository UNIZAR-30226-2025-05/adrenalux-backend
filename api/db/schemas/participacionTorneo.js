import { pgTable, primaryKey,integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { torneo } from './torneo.js';
import { user } from './user.js';

export const participacionTorneo = pgTable('participacionTorneo', {
  user_id: integer('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  torneo_id: integer('torneo_id')
    .notNull()
    .references(() => torneo.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({
    columns: [table.user_id, table.torneo_id],
  })
]);

export const participacionTorneoSelectSchema = createSelectSchema(participacionTorneo).partial();
export const participacionTorneoInsertSchema = createInsertSchema(participacionTorneo).partial();

export const schema = {
  user,
  torneo,
};
