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

async function insertarTorneo({creador_id, nombre, contrasena, premio, descripcion }) {
    try {
        
        await db.insert(torneo).values({
            creador_id: creador_id,
            nombre: nombre,
            contrasena: contrasena || null,
            premio: premio,
            descripcion: descripcion,
            fecha_inicio: new Date(),
            torneo_en_curso: false
        });

        const [torneoCreado] = await db.select().from(torneo).where(eq(torneo.nombre, nombre));

        if (!torneoCreado) {
            throw new Error("No se pudo recuperar el torneo creado.");
        }
        return torneoCreado;
    } catch (error) {
        throw new Error("Error al crear torneo en la base de datos");
    }
}


async function inscribirUsuarioAlTorneo(userId, torneoId) {
    try {
        await db.insert(participacionTorneo).values({ torneo_id: torneoId, user_id: userId });
    } catch (error) {
        throw new Error("Error al inscribir usuario en el torneo");
    }
}


export async function crearTorneo(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        if (!token?.id) return next(new Error("Token inválido o usuario no autenticado"));

        const userId = token.id;
        validarDatosTorneo(req.body);

        const torneoCreado = await insertarTorneo(userId,req.body);
        await inscribirUsuarioAlTorneo(userId, torneoCreado.id);

        return sendResponse(req, res, { data: objectToJson(torneoCreado) });

    } catch (error) {
        return next(error);
    }
}

async function verificarTorneoDisponible(torneoId) {
    const [torneoData] = await db.select().from(torneo).where(eq(torneo.id, torneoId));
    
    if (!torneoData) {
        throw new NotFound('Torneo no encontrado');
    }
    
    if (torneoData.torneo_en_curso) {
        throw new BadRequest('El torneo ya está en curso');
    }
    
    return torneoData;
}

async function verificarInscripcionUsuario(torneoId, userId) {
    const [yaInscrito] = await db.select()
        .from(participacionTorneo)
        .where(
            and(
                eq(participacionTorneo.torneo_id, torneoId),
                eq(participacionTorneo.user_id, userId)
            )
        );
    
    if (yaInscrito) {
        throw new BadRequest('Ya estás inscrito en este torneo');
    }
}

async function verificarCapacidadTorneo(torneoId) {
    const participantes = await db.select()
        .from(participacionTorneo)
        .where(eq(participacionTorneo.torneo_id, torneoId));
    
    if (participantes.length >= MAX_PARTICIPANTES) {
        throw new BadRequest('El torneo ha alcanzado su capacidad máxima');
    }
    
    return participantes;
}

async function verificarContrasenaTorneo(torneoData, contrasena) {
    if (torneoData.contrasena && torneoData.contrasena !== contrasena) {
        throw new BadRequest('Contraseña incorrecta');
    }
}

async function manejarInicioAutomatico(torneoId) {
    const participantesActualizados = await db.select()
        .from(participacionTorneo)
        .where(eq(participacionTorneo.torneo_id, torneoId));
    
    if (participantesActualizados.length === MAX_PARTICIPANTES) {
        await ponerEnMarchaTorneo(torneoId);
        await realizarEmparejamientoInicial(torneoId, participantesActualizados);
        return true;
    }
    
    return false;
}

// Función principal
export async function unirseTorneo(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        if (!token?.id) return next(new Error("Token inválido o usuario no autenticado"));

        const userId = token.id;
        const { torneo_id, contrasena } = req.body;

        const torneoData = await verificarTorneoDisponible(torneo_id);
        await verificarInscripcionUsuario(torneo_id, userId);
        await verificarCapacidadTorneo(torneo_id);
        await verificarContrasenaTorneo(torneoData, contrasena);

        await inscribirUsuarioAlTorneo(userId, torneo_id);

        const torneoIniciado = await manejarInicioAutomatico(torneo_id);

        return sendResponse(req, res, { 
            success: true,
            message: torneoIniciado 
                ? '¡Torneo iniciado automáticamente al completarse!' 
                : 'Te has unido al torneo correctamente',
            data: objectToJson(torneoData),
            iniciado: torneoIniciado
        });

    } catch (error) {
        console.error("Error en unirseTorneo:", error);
        return next(error);
    }
}

export async function obtenerTorneosActivos(req, res, next) {
    try {
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
        return next(error);
    }
}

export async function obtenerDetallesTorneo(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { id } = req.params;

        if (!userId) return next(new Error("Token inválido o usuario no autenticado"));

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
        return next(error);
    }
}

export async function empezarTorneo(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { torneo_id } = req.body;

        if (!userId) return next(new Error("Token inválido o usuario no autenticado"));

        // Obtener datos del torneo
        const [torneoData] = await db.select().from(torneo).where(eq(torneo.id, torneo_id));
        if (!torneoData) return next(new NotFound('Torneo no encontrado'));

        if (torneoData.creador_id !== userId) {
            return next(new BadRequest('Solo el creador del torneo puede iniciarlo'));
        }

        if (torneoData.torneo_en_curso) {
            return next(new BadRequest('El torneo ya está en curso'));
        }

        const participantes = await db.select().from(participacionTorneo).where(eq(participacionTorneo.torneo_id, torneo_id));
        
        if (participantes.length < 2) {
            return next(new BadRequest('Se necesitan al menos 2 participantes para empezar'));
        }

        if (participantes.length % 2 !== 0) {
            return next(new BadRequest('El número de participantes debe ser par (2, 4, 6 u 8)'));
        }

        await ponerEnMarchaTorneo(torneo_id);
        // Aquí iría la lógica para el emparejamiento inicial
        // await realizarEmparejamientoInicial(torneo_id, participantes);

        return sendResponse(req, res, { 
            message: 'Torneo iniciado correctamente',
            data: objectToJson(torneoData) 
        });

    } catch (error) {
        return next(error);
    }
}

async function ponerEnMarchaTorneo(torneoId) {
    try {
        await db.update(torneo).set({ torneo_en_curso: true }).where(eq(torneo.id, torneoId));
    } catch (error) {
        throw new Error("Error al cerrar torneo en la base de datos");
    }
}


async function anadirGanadorAlTorneo(torneoId, userId) {
    try {
        const [torneoData] = await db.select().from(torneo).where(eq(torneo.id, torneoId));
        if (!torneoData) return next(new NotFound('Torneo no encontrado'));

        if (torneoData.ganador_id) return next(new BadRequest('El torneo ya tiene un ganador'));

        await db.update(torneo).set({ ganador_id: userId }).where(eq(torneo.id, torneoId));
    } catch (error) {
        throw new Error("Error al cerrar torneo en la base de datos");
    }
}

