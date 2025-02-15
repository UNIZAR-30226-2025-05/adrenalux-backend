import { pgTable, varchar, integer, foreignKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { torneo } from './torneo';
import { user } from './user';

export const patricipacionTorneo = pgTable(
  {
    user_id: varchar('user_id', { length: 50 }).notNull().references(() => user.id),
    torneo_id: varchar('torneo_id', { length: 50 }).notNull().references(() => torneo.id),       
 }
 ,(table) => ({
    compuesta: primaryKey({
      columns: [table.user_id, table.torneo_id]
    })
  })
);

export const patricipacionTorneoSelectSchema = createSelectSchema(patricipacionTorneo).partial();
export const patricipacionTorneoInsertSchema = createInsertSchema(patricipacionTorneo).partial();

export const schema = {
  user,
  torneo,
};
