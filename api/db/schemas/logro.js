import { pgTable, serial, varchar, integer, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const logro = pgTable(
  {
    id: serial('id')
      .primaryKey()
      .autoincrement(), 
    description: text('description')
      .notNull(), 
    reward_type: varchar('reward_type', { length: 10 })
      .notNull(),
    reward_amount: integer('reward_amount')
      .notNull(),
    required_experience: integer('required_experience')
      .notNull(), 
 }
);

export const logroSelectSchema = createSelectSchema(logro).partial();
export const logroInsertSchema = createInsertSchema(logro).partial();

export const schema = {
    logro,
};
