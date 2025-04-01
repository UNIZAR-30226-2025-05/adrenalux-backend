import { user } from '../db/schemas/user.js';
import { torneo } from '../db/schemas/torneo.js';
import { participacionTorneo } from '../db/schemas/participacionTorneo.js';
import { db } from '../config/db.js';
import { sendResponse, NotFound, BadRequest } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import { objectToJson } from '../lib/toJson.js';
import { eq, isNull } from 'drizzle-orm';
import { MAX_PARTICIPANTES } from '../config/torneos.config.js';


function validarDatosTorneo({ nombre, premio, descripcion }) {
    if (!nombre || !premio || !descripcion) {
        throw new BadRequest("Faltan campos obligatorios (nombre, premio, descripcion)");
    }
}

async function insertarTorneo({ nombre, contrasena, premio, descripcion }) {
    try {
        console.log("[DB] Insertando nuevo torneo...");
        
        await db.insert(torneo).values({
            nombre: nombre,
            contrasena: contrasena || null,
            premio: premio,
            descripcion: descripcion,
            fecha_inicio: new Date()
        });

        const [torneoCreado] = await db.select().from(torneo).where(eq(torneo.nombre, nombre));

        if (!torneoCreado) {
            throw new Error("No se pudo recuperar el torneo creado.");
        }

        console.log("[DB] Torneo creado con ID:", torneoCreado.id);
        return torneoCreado;
    } catch (error) {
        console.error("[DB ERROR] Error al insertar torneo:", error);
        throw new Error("Error al crear torneo en la base de datos");
    }
}


async function inscribirUsuarioAlTorneo(userId, torneoId) {
    try {
        console.log(`[DB] Inscribiendo usuario ${userId} en torneo ${torneoId}...`);
        await db.insert(participacionTorneo).values({ torneo_id: torneoId, user_id: userId });
        console.log("[DB] Usuario inscrito correctamente.");
    } catch (error) {
        console.error("[DB ERROR] Error al inscribir usuario en torneo:", error);
        throw new Error("Error al inscribir usuario en el torneo");
    }
}


export async function crearTorneo(req, res, next) {
    try {
        console.log("[API] Recibiendo solicitud para crear torneo...");
        const token = await getDecodedToken(req);
        if (!token?.id) return next(new Error("Token inválido o usuario no autenticado"));

        const userId = token.id;
        validarDatosTorneo(req.body);

        const torneoCreado = await insertarTorneo(req.body);
        await inscribirUsuarioAlTorneo(userId, torneoCreado.id);

        return sendResponse(req, res, { data: objectToJson(torneoCreado) });

    } catch (error) {
        console.error("[ERROR] Error en crearTorneo:", error);
        return next(error);
    }
}


export async function unirseTorneo(req, res, next) {
    try {
        console.log("[API] Recibiendo solicitud para unirse a torneo...");
        const token = await getDecodedToken(req);
        if (!token?.id) return next(new Error("Token inválido o usuario no autenticado"));

        const userId = token.id;
        const { torneo_id, contrasena } = req.body;

        const [torneoData] = await db.select().from(torneo).where(eq(torneo.id, torneo_id));
        if (!torneoData) return next(new NotFound('Torneo no encontrado'));

        const participantes = await db.select().from(participacionTorneo).where(eq(participacionTorneo.torneo_id, torneo_id));
        if (participantes.length >= MAX_PARTICIPANTES) return next(new BadRequest('El torneo ha alcanzado su capacidad máxima'));

        if (torneoData.contrasena && torneoData.contrasena !== contrasena) {
            return next(new BadRequest('Contraseña incorrecta'));
        }

        await inscribirUsuarioAlTorneo(userId, torneo_id);

        return sendResponse(req, res, { data: objectToJson(torneoData) });

    } catch (error) {
        console.error("[ERROR] Error en unirseTorneo:", error);
        return next(error);
    }
}

export async function obtenerTorneosActivos(req, res, next) {
    try {
        console.log("[API] Obteniendo torneos activos...");
        await getDecodedToken(req);

        const torneos = await db.select().from(torneo).where(isNull(torneo.ganador_id));
        if (!torneos.length) return next(new NotFound('No hay torneos activos'));

        return sendResponse(req, res, { data: torneos.map(objectToJson) });

    } catch (error) {
        console.error("[ERROR] Error en obtenerTorneosActivos:", error);
        return next(error);
    }
}


export async function obtenerTorneosJugados(req, res, next) {
    try {
        console.log("[API] Obteniendo torneos jugados...");
        const token = await getDecodedToken(req);
        const userId = token.id;

        const torneosJugados = await db.select().from(participacionTorneo).where(eq(participacionTorneo.user_id, userId));
        if (!torneosJugados.length) return next(new NotFound('No hay torneos jugados'));

        const torneosConInfo = [];
        for (let { torneo_id } of torneosJugados) {
            const [torneoInfo] = await db.select().from(torneo).where(eq(torneo.id, torneo_id));
            if (torneoInfo) torneosConInfo.push({ torneo_id, torneo: torneoInfo });
        }

        return sendResponse(req, res, { data: torneosConInfo });

    } catch (error) {
        console.error("[ERROR] Error en obtenerTorneosJugados:", error);
        return next(error);
    }
}

export async function obtenerDetallesTorneo(req, res, next) {
    try {
        console.log("[API] Obteniendo detalles del torneo...");
        const token = await getDecodedToken(req);
        const { id } = req.params;

        const [torneoData] = await db.select().from(torneo).where(eq(torneo.id, id));
        if (!torneoData) return next(new NotFound('Torneo no encontrado'));

        const participantes = await db.select().from(participacionTorneo).where(eq(participacionTorneo.torneo_id, id));
        const participantesConDetalles = [];

        for (let { user_id } of participantes) {
            const [usuarioDetails] = await db.select().from(user).where(eq(user.id, user_id));
            if (usuarioDetails) {
                participantesConDetalles.push({
                    user_id,
                    nombre: usuarioDetails.name,
                    nivel: usuarioDetails.level,
                    avatar: usuarioDetails.avatar,
                });
            }
        }

        return sendResponse(req, res, { data: { torneo: torneoData, participantes: participantesConDetalles } });

    } catch (error) {
        console.error("[ERROR] Error en obtenerDetallesTorneo:", error);
        return next(error);
    }
}

