import { sendResponse } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import { db } from '../config/db.js';
import { user,partida } from '../db/schemas/carta.js';
import { objectToJson } from '../lib/toJson.js';
import { eq,or } from 'drizzle-orm';
import { getFriends } from './amigos';
import { json } from 'express';

export async function obtenerClasificacionTotal(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;  
        const usuario = await db.select().from(user).where(eq(user.id, userId));
        const clasificacionTotal = [];

        if (!usuario) return next(new NotFound('Usuario no encontrado'));
        const usuariosTotales = await db.select().from(user).orderBy(user.puntosClasificacion, 'desc');

        for(usuario in usuariosTotales){
            const estadisticas = await getEstadisticasPartidas(usuario.id);
            clasificacionTotal.push({
                user : usuario,
                estadisticas : estadisticas
            });
        }
        const usuariosJson = objectToJson(clasificacionTotal);
        
        return sendResponse(req, res, { data: usuariosJson });
    } catch (error) {
        console.error('Error obteniendo clasificación total:', error);
        return next(error);
    }
}

export async function obtenerClasificacionAmigos(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        claisificacionAmigos = [];

        const amigos = await getFriends(userId);
        for (amigo in amigos) {
            const usuario = await db.select().from(user).where(eq(user.id, amigo.id));
            const estadisticas = await getEstadisticasPartidas(amigo.id);
            clasificacionAmigos.push({
                user : usuario,
                estadisticas : estadisticas
            });
        }
        const amigosJson = objectToJson(clasificacionAmigos);

        return sendResponse(req, res, { data: amigosJson });
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
        ))
        .count();

    const partidasGanadas = await db
        .select()
        .from(partida)
        .where(eq(partida.ganador_id, userId))
        .count();

    const partidasPerdidas = partidasJugadas - partidasGanadas;

    return {
        partidasJugadas,
        partidasGanadas,
        partidasPerdidas
    };
}