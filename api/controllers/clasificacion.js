import { sendResponse } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import { db } from '../config/db.js';
import { user } from '../db/schemas/user.js';
import { partida } from '../db/schemas/partida.js';
import { amistad } from '../db/schemas/amistad.js';
import { objectToJson } from '../lib/toJson.js';
import { eq, or, and } from 'drizzle-orm';

export async function obtenerClasificacionTotal(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;

        const usuario = await db.select().from(user).where(eq(user.id, userId));

        if (!usuario) {
            return next(new NotFound('Usuario no encontrado'));
        }

        const usuariosTotales = await db.select().from(user).orderBy(user.puntosClasificacion, 'desc');

        const usuariosConPartidas = await Promise.all(usuariosTotales.map(async (usuario) => {
            const estadisticas = await getEstadisticasPartidas(usuario.id);

            return {
                userid: usuario.id,
                username: usuario.username,
                name: usuario.name,
                lastname: usuario.lastname,
                avatar: usuario.avatar,
                friend_code: usuario.friend_code,
                level: usuario.level,
                experience: usuario.experience,
                clasificacion: usuario.puntosClasificacion,
                estadisticas: estadisticas
            };
        }));

        return sendResponse(req, res, { data: usuariosConPartidas });
    } catch (error) {
        console.error('Error en obtenerClasificacionTotal:', error);
        return next(error);
    }
}

export async function obtenerClasificacionAmigos(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;

        const amigos = await getFriends(userId);
        const clasificacionAmigos = [];

        for (const amigo of amigos) {
            const usuarioArray = await db.select().from(user).where(eq(user.id, amigo.id));
            const usuario = usuarioArray[0];

            if (usuario) {
                const estadisticas = await getEstadisticasPartidas(usuario.id);
                clasificacionAmigos.push({
                    userid: usuario.id,
                    username: usuario.username,
                    name: usuario.name,
                    lastname: usuario.lastname,
                    avatar: usuario.avatar,
                    friend_code: usuario.friend_code,
                    level: usuario.level,
                    experience: usuario.experience,
                    clasificacion: usuario.puntosClasificacion,
                    estadisticas: estadisticas
                });
            }
        }

        return sendResponse(req, res, { data: clasificacionAmigos });
    } catch (error) {
        console.error('Error obteniendo clasificación de amigos:', error);
        return next(error);
    }
}

async function getEstadisticasPartidas(userId) {
    const partidasJugadas = await db
        .select()
        .from(partida)
        .where(or(
            eq(partida.user1_id, userId),
            eq(partida.user2_id, userId)
        ));

    const partidasGanadas = await db
        .select()
        .from(partida)
        .where(eq(partida.ganador_id, userId));

    const partidasPerdidas = partidasJugadas.length - partidasGanadas.length;

    return {
        partidasJugadas: partidasJugadas.length,
        partidasGanadas: partidasGanadas.length,
        partidasPerdidas: partidasPerdidas
    };
}

export async function getFriends(userId) {
    try {
        const rawFriends = await db
            .select({
                id: user.id,
                username: user.username,
                name: user.name,
                lastname: user.lastname,
                avatar: user.avatar,
                friend_code: user.friend_code,
                level: user.level,
                adrenacoins: user.adrenacoins,
                experience: user.experience
            })
            .from(user)
            .innerJoin(
                amistad,
                or(
                    and(
                        eq(amistad.user1_id, userId),
                        eq(amistad.user2_id, user.id)
                    ),
                    and(
                        eq(amistad.user2_id, userId),
                        eq(amistad.user1_id, user.id)
                    )
                )
            )
            .where(eq(amistad.estado, 'aceptada'));

        const friends = rawFriends.map(friend => ({
            ...friend,
        }));

        return friends;
    } catch (error) {
        console.error('Error getting friends:', error);
        throw error;
    }
}