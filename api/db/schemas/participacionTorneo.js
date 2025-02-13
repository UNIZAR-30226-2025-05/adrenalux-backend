import { pgTable, varchar, integer, foreignKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { torneo } from './torneo';
import { users } from './user';

export const patricipacionTorneo = pgTable('patricipacionTorneo', {
  user_id: varchar('user_id', { length: 50 }).notNull(),
  torneo_id: varchar('torneo_id', { length: 50 }).notNull(),
  
  user_id: foreignKey('user_id').references(users.username),
  torneo_id: foreignKey('torneo_id').references(torneo.id),

  primaryKey: pgTable.primaryKey('user_id', 'torneo_id')
});

export const patricipacionTorneoSelectSchema = createSelectSchema(patricipacionTorneo).partial();
export const patricipacionTorneoInsertSchema = createInsertSchema(patricipacionTorneo).partial();

export const schema = {
  users,
  patricipacionTorneo,
};
