import { pgTable, primaryKey,integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { torneo } from './torneo';
import { user } from './user';

export const participacionTorneo = pgTable('participacionTorneo', {
  user_id: integer('user_id', { length: 50 })
    .notNull()
    .references(() => user.id),
  torneo_id: integer('torneo_id', { length: 50 })
    .notNull()
    .references(() => torneo.id),
}, (table) => [
  primaryKey({
    columns : [table.user_id, table.torneo_id],
  }) 
]);

export const participacionTorneoSelectSchema = createSelectSchema(participacionTorneo).partial();
export const participacionTorneoInsertSchema = createInsertSchema(participacionTorneo).partial();

export const schema = {
  user,
  torneo,
};
