import { pgTable, varchar, integer, boolean, text, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Definición de la tabla intermedia para la relación N-N entre 'users' y 'achievements'
export const userAchievements = pgTable('user_achievements', {
  // Atributos de la tabla
  username: varchar('username', { length: 50 }).notNull(), // Usuario que intenta desbloquear el logro
  achievement_id: integer('achievement_id').notNull(), // ID del logro
  achieved: boolean('achieved').notNull().default(false), // Indica si se ha conseguido el logro
  achieved_at: text('achieved_at'), // Fecha en la que se desbloqueó (puede ser null si aún no se ha logrado)
  
  // Referencias a las tablas 'users' y 'achievements'
  username: varchar('username', { length: 50 }).notNull().references(() => users.username),
  achievement_id: integer('achievement_id').notNull().references(() => achievements.id),
}, (table) => {
  // Definición de clave primaria compuesta
  return {
    pk: primaryKey(table.username, table.achievement_id),
  };
});

// Schemas para validaciones
export const userAchievementsSelectSchema = createSelectSchema(userAchievements).partial();
export const userAchievementsInsertSchema = createInsertSchema(userAchievements).partial();

export const schema = {
  userAchievements,
};
