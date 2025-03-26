import { user } from '../db/schemas/user.js';
import {torneo} from '../db/schemas/torneo.js';
import { db } from '../config/db.js';
import { sendResponse, NotFound, BadRequest } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import { objectToJson } from '../lib/toJson.js';
import { participacionTorneo } from '../db/schemas/participacionTorneo.js';
import { BadRequest, NotFound, sendResponse } from '../lib/http.js';
import { eq } from 'drizzle-orm';
import {MAX_PARTICIPANTES} from '../config/torneo.config.js';


 export async function crearTorneo(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;

        const { nombre, contrasena, premio, descripcion  } = req.body;

        const torneoCreado = await db.insert(torneo).values({
                  nombre: nombre,
                  contrasena: contrasena,
                  premio: premio,
                  descripcion: descripcion,
                  ganador_id: null,
                  fecha_inicio: new Date(),    
                });
        
         const torneo = await db.select().from(torneo).where(eq(torneo.nombre, nombre));
            if (!torneo) {
                return next(new NotFound('Torneo no encontrado'));
        }

        const participacion = await db.insert(participacionTorneo).values({
            torneo_id: torneo.id,
            user_id: userId,
        });
        torneoJson = objectToJson(torneo);

    }
    catch (error) {
        throw new Error("Error al crear torneo");
    }
    return sendResponse(req, res, { data: torneoJson });
}

export async function unirseTorneo(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { torneo_id, contrasena } = req.body;
    
        // Obtener el torneo
        const torneoData = await db.select().from(torneo).where(eq(torneo.id, torneo_id));
        if (!torneoData) {
            return next(new NotFound('Torneo no encontrado'));
        }
    
        // Verificar si el torneo alcanza el máximo de participantes
        const participantes = await db.select().from(participacionTorneo).where(eq(participacionTorneo.torneo_id, torneo_id));
        if (participantes.length >= MAX_PARTICIPANTES) {
            return next(new BadRequest('El torneo ha alcanzado su capacidad máxima'));
        }
    
        // Verificación de contraseña si el torneo tiene una contraseña
        if (torneoData.contrasena && torneoData.contrasena !== contrasena) {
            return next(new BadRequest('Contraseña incorrecta'));
        }
    
        // Insertar la participación en el torneo
        await db.insert(participacionTorneo).values({
            torneo_id: torneo_id,
            user_id: userId,
        });
    
    } catch (error) {
        console.error(error);
        next(new Error("Error al unirse al torneo"));
    }
    return sendResponse(req, res, { data: objectToJson(torneoData) });

    
}

 export async function obtenerTorneosActivos(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;

        const torneos = await db.select().from(torneo).where(eq(torneo.ganador_id, null));
        if (!torneos) {
            return next(new NotFound('No hay torneos activos'));
        }
        const torneosJson = torneos.map(torneo => objectToJson(torneo));
    }
    catch (error) {
        throw new Error("Error al obtener torneos activos");
    }
    return  sendResponse(req, res, { data :torneosJson });

 }

 export async function obtenerTorneosJugados(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        let torneosJson = [];

        // Obtener los torneos en los que el usuario ha participado
        const torneosJugados = await db
            .select(participacionTorneo.torneo_id)
            .from(participacionTorneo)
            .where(eq(participacionTorneo.user_id, userId));

        if (torneosJugados.length === 0) {
            return next(new NotFound('No hay torneos jugados'));
        }

        // Obtener información de cada torneo
        for (const participacion of torneosJugados) {
            const torneoData = await db
                .select()
                .from(torneo)
                .where(eq(torneo.id, participacion.torneo_id))

            if (torneoData) {
                torneosJson.push(objectToJson(torneoData));
            }
        }
        return sendResponse(req, res, { data: torneosJson });

    } catch (error) {
        console.error(error);
        return next(new Error("Error al obtener torneos jugados"));
    }
}

export async function obtenerDetallesTorneo(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { torneo_id } = req.body;

        const torneoData = await db.select().from(torneo).where(eq(torneo.id, torneo_id));
        if (!torneoData) {
            return next(new NotFound('Torneo no encontrado'));
        }

        const participantes = await db.select().from(participacionTorneo).where(eq(participacionTorneo.torneo_id, torneo_id));
        const participantesJson = participantes.map(participante => objectToJson(participante));
        const torneoJson = objectToJson(torneoData);
        
        DetallesTorneoJson = {
            torneo: torneoJson,
            participantes: participantesJson,
        };
    }
    catch (error) {
        throw new Error("Error al obtener detalles del torneo");
    }
    return sendResponse(req, res, { data: DetallesTorneoJson });
}

