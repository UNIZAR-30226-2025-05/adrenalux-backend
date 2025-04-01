import { user } from '../db/schemas/user.js';
import {torneo} from '../db/schemas/torneo.js';
import { db } from '../config/db.js';
import { sendResponse, NotFound, BadRequest } from '../lib/http.js';
import { isNull } from 'drizzle-orm';
import { getDecodedToken } from '../lib/jwt.js';
import { objectToJson } from '../lib/toJson.js';
import { participacionTorneo } from '../db/schemas/participacionTorneo.js';
import { eq } from 'drizzle-orm';
import {MAX_PARTICIPANTES} from '../config/torneos.config.js';


export async function crearTorneo(req, res, next) {
    try {
        console.log("Recibiendo solicitud para crear torneo...");

        const token = await getDecodedToken(req);
        if (!token || !token.id) {
            return next(new Error("Token inválido o usuario no autenticado"));
        }
        const userId = token.id;
        const { nombre, contrasena, premio, descripcion } = req.body;

        if (!nombre || !premio || !descripcion) {
            return next(new Error("Faltan campos obligatorios (nombre, premio, descripcion)"));
        }
        const torneoCreado = await db.insert(torneo).values({
              nombre,
              contrasena: contrasena || null,
              premio,
              descripcion,
              ganador_id: null,
        });

        const [torneoEncontrado] = await db.select().from(torneo).where(eq(torneo.nombre, nombre));

        if (!torneoEncontrado) {
            return next(new NotFound("Torneo no encontrado"));
        }

        await db.insert(participacionTorneo).values({
            torneo_id: torneoEncontrado.id,
            user_id: userId,
        });

        const torneoJson = objectToJson(torneoEncontrado);
        return sendResponse(req, res, { data: torneoJson });

    } catch (error) {
        return next(new Error("Error al crear torneo"));
    }
}


export async function unirseTorneo(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { torneo_id, contrasena } = req.body;
    
        const torneoData = await db.select().from(torneo).where(eq(torneo.id, torneo_id));
        if (!torneoData) {
            return next(new NotFound('Torneo no encontrado'));
        }

        // Verificar si el torneo alcanza el máximo de participantes
        const participantes = await db.select().from(participacionTorneo).where(eq(participacionTorneo.torneo_id, torneo_id));
        if (participantes.length >= MAX_PARTICIPANTES) {
            return next(new BadRequest('El torneo ha alcanzado su capacidad máxima'));
        }

        if (torneoData.contrasena && torneoData.contrasena !== contrasena) {
            return next(new BadRequest('Contraseña incorrecta'));
        }
    
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
        const torneos = await db.select().from(torneo).where(isNull(torneo.ganador_id));

        if (!torneos || torneos.length === 0) {
            return next(new NotFound('No hay torneos activos'));
        }

        const torneosJson = torneos.map(t => objectToJson(t));
        return sendResponse(req, res, { data: torneosJson });

    } catch (error) {
        console.error("Error al obtener torneos activos:", error);
        return next(new Error("Error al obtener torneos activos"));
    }
}


export async function obtenerTorneosJugados(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const torneosConInfo = [];


        const torneosJugados = await db
            .select() // Seleccionamos los campos de la tabla participacionTorneo
            .from(participacionTorneo)
            .where(eq(participacionTorneo.user_id, userId));

        if (torneosJugados.length === 0) {
            return next(new NotFound('No hay torneos jugados'));
        }
        for (let i = 0; i < torneosJugados.length; i++) {
            const torneoId = torneosJugados[i].torneo_id;

            const torneoInfo = await db
                .select() 
                .from(torneo) 
                .where(eq(torneo.id, torneoId));

            if (torneoInfo.length > 0) {
                torneosConInfo.push({
                    ...torneosJugados[i], 
                    torneo: torneoInfo[0], 
                });
            }
        }
        return sendResponse(req, res, { data: torneosConInfo });

    } catch (error) {
        console.error(error);
        return next(new Error("Error al obtener torneos jugados"));
    }
}



export async function obtenerDetallesTorneo(req, res, next) {
    let DetallesTorneoJson = {};
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { id } = req.params;
        const participantesConDetalles = [];


        const torneoData = await db.select().from(torneo).where(eq(torneo.id, id));

        if (!torneoData || torneoData.length === 0) {
            console.error('Torneo no encontrado');
            return next(new NotFound('Torneo no encontrado'));
        }

        const participantes = await db.select().from(participacionTorneo).where(eq(participacionTorneo.torneo_id, id));
        console.log('Participantes del torneo:', participantes);

        if (!participantes || participantes.length === 0) {
            console.warn('No hay participantes en este torneo');
        }

        for (let usuario of participantes) {
            const usuarioDetails = await db.select().from(user).where(eq(user.id, usuario.user_id));

            if (usuarioDetails && usuarioDetails.length > 0) {
                const usuarioJson = usuarioDetails[0]; 
                participantesConDetalles.push({
                    user_id: usuario.user_id,
                    nombre: usuarioJson.name,
                    nivel: usuarioJson.level,
                    avatar: usuarioJson.avatar,
                });
            } else {
                console.warn('Usuario no encontrado para el participante:', usuario.user_id);
            }
        }

        const torneoJson = torneoData[0]; 

        DetallesTorneoJson = {
            torneo: torneoJson,
            participantes: participantesConDetalles,
        };

    } catch (error) {
        console.error('Error al obtener detalles del torneo:', error);
        return next(new Error("Error al obtener detalles del torneo"));
    }
    return sendResponse(req, res, { data: DetallesTorneoJson });
}

