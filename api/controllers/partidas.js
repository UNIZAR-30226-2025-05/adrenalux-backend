import { db } from '../config/db.js';
import { getDecodedToken } from '../lib/jwt.js';
import { partida } from '../db/schemas/partida.js';
import { eq, and, or } from 'drizzle-orm';
import { sendResponse } from '../lib/http.js';

export async function getPartidasPausadas(req, res, next) {
  try {
    const token = await getDecodedToken(req);
    const userId = token.id;

    const pausedMatches = await db.select()
      .from(partida)
      .where(and(
        eq(partida.estado, 'pausada'),
        or(
          eq(partida.user1_id, userId),
          eq(partida.user2_id, userId)
        )
      ));

    return sendResponse(req, res, { data: { pausedMatches: pausedMatches ?? [] } });
  } catch (error) {
    return next(error);
  }
}
