import { text, varchar, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './user.js';

export const amistad = pgTable(
  {
    user1_id: varchar('user1_id', { length: 50 })
      .notNull()
      .references(() => user.username),
    user2_id: varchar('user2_id', { length: 50 })
      .notNull()
      .references(() => user.username),
    created_at: text('created_at')
      .notNull()
      .default(new Date().toISOString()),
  },
  (table) => ({
    compuesta: primaryKey({
      columns: [table.user1_id, table.user2_id]
    })
  })
);

export const amistadSelectSchema = createSelectSchema(amistad).partial();
export const amistadInsertSchema = createInsertSchema(amistad).partial();

export const schema = {
  user,
  amistad,
};