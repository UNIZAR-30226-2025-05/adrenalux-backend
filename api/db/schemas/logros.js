import { pgTable, serial, varchar, integer, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const logros = pgTable('logros', {
  id: serial('id').primaryKey(), 
  description: text('description').notNull(), 
  reward_type: varchar('reward_type', { length: 10 }).notNull(),
  reward_amount: integer('reward_amount').notNull(),
  required_experience: integer('required_experience').notNull(), 
});

export const logrosSelectSchema = createSelectSchema(logros).partial();
export const logrosInsertSchema = createInsertSchema(logros).partial();

export const schema = {
    logros,
};
