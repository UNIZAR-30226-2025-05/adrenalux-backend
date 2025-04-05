import { user } from '../db/schemas/user.js';
import { torneo } from '../db/schemas/torneo.js';
import { participacionTorneo } from '../db/schemas/participacionTorneo.js';
import { db } from '../config/db.js';
import { sendResponse, NotFound, BadRequest } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import { objectToJson } from '../lib/toJson.js';
import { eq, and, isNull } from 'drizzle-orm';
import { MAX_PARTICIPANTES } from '../config/torneos.config.js';



function validarDatosCreacion({ nombre, premio, descripcion }) {
    if (!nombre || !premio || !descripcion) {
        throw new BadRequest("Faltan campos obligatorios (nombre, premio, descripcion)");
    }
}

async function crearTorneoEnDB({ creador_id, nombre, contrasena, premio, descripcion }) {
    await db.insert(torneo).values({
        creador_id,
        nombre,
        contrasena: contrasena || null,
        premio,
        descripcion,
        fecha_inicio: new Date(),
        torneo_en_curso: false
    });
    
    const [torneoCreado] = await db.select().from(torneo).where(eq(torneo.nombre, nombre));
    if (!torneoCreado) throw new Error("No se pudo recuperar el torneo creado.");
    return torneoCreado;
}

async function registrarParticipante(userId, torneoId) {
    await db.insert(participacionTorneo).values({ torneo_id: torneoId, user_id: userId });
}

async function obtenerTorneoPorId(torneoId) {
    const [torneoData] = await db.select().from(torneo).where(eq(torneo.id, torneoId));
    if (!torneoData) throw new NotFound('Torneo no encontrado');
    return torneoData;
}

async function verificarUsuarioInscrito(torneoId, userId) {
    const [yaInscrito] = await db.select()
        .from(participacionTorneo)
        .where(and(
            eq(participacionTorneo.torneo_id, torneoId),
            eq(participacionTorneo.user_id, userId)
        ));
    if (yaInscrito) throw new BadRequest('Ya estás inscrito en este torneo');
}

async function contarParticipantes(torneoId) {
    return await db.select()
        .from(participacionTorneo)
        .where(eq(participacionTorneo.torneo_id, torneoId));
}

function validarContrasena(torneoData, contrasena) {
    if (torneoData.contrasena && torneoData.contrasena !== contrasena) {
        throw new BadRequest('Contraseña incorrecta');
    }
}

async function iniciarTorneoSiCompleto(torneoId) {
    const participantes = await contarParticipantes(torneoId);
    if (participantes.length === MAX_PARTICIPANTES) {
        await db.update(torneo).set({ torneo_en_curso: true }).where(eq(torneo.id, torneoId));
        // await realizarEmparejamientoInicial(torneoId, participantes);
        return true;
    }
    return false;
}

async function obtenerTorneosSinGanador() {
    return await db.select().from(torneo).where(isNull(torneo.ganador_id));
}

async function obtenerTorneosDeUsuario(userId) {
    return await db.select()
        .from(participacionTorneo)
        .where(eq(participacionTorneo.user_id, userId));
}

async function obtenerInfoTorneo(torneoId) {
    const [torneoInfo] = await db.select().from(torneo).where(eq(torneo.id, torneoId));
    return torneoInfo ? { torneo_id: torneoId, torneo: torneoInfo } : null;
}

async function obtenerDetallesParticipantes(torneoId) {
    const participantes = await db.select()
        .from(participacionTorneo)
        .where(eq(participacionTorneo.torneo_id, torneoId));
    
    const detalles = [];
    for (const { user_id } of participantes) {
        const [usuario] = await db.select().from(user).where(eq(user.id, user_id));
        if (usuario) {
            detalles.push({
                user_id,
                nombre: usuario.name,
                nivel: usuario.level,
                avatar: usuario.avatar,
            });
        }
    }
    return detalles;
}

async function validarInicioTorneo(userId, torneoId) {
    const torneoData = await obtenerTorneoPorId(torneoId);
    if (torneoData.creador_id !== userId) throw new BadRequest('Solo el creador puede iniciarlo');
    if (torneoData.torneo_en_curso) throw new BadRequest('El torneo ya está en curso');
    
    const participantes = await contarParticipantes(torneoId);
    if (participantes.length < 2) throw new BadRequest('Se necesitan al menos 2 participantes');
    if (participantes.length % 2 !== 0) throw new BadRequest('Número de participantes debe ser par');
    
    return torneoData;
}

async function marcarTorneoEnCurso(torneoId) {
    await db.update(torneo).set({ torneo_en_curso: true }).where(eq(torneo.id, torneoId));
}

async function asignarGanador(torneoId, userId) {
    const [torneoData] = await db.select().from(torneo).where(eq(torneo.id, torneoId));
    if (!torneoData) throw new NotFound('Torneo no encontrado');
    if (torneoData.ganador_id) throw new BadRequest('El torneo ya tiene un ganador');
    await db.update(torneo).set({ ganador_id: userId }).where(eq(torneo.id, torneoId));
}


export async function crearTorneo(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;

        if (!userId) return next(new Error("Token inválido o usuario no autenticado"));

       const {nombre, contrasena, premio, descripcion} = req.body;

        validarDatosCreacion(req.body);
        const torneoCreado = await crearTorneoEnDB({userId, nombre, contrasena, premio, descripcion});
        await registrarParticipante(userId, torneoCreado.id);

        return sendResponse(req, res, { data: objectToJson(torneoCreado) });
    } catch (error) {
        return next(error);
    }
}

export async function unirseTorneo(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        if (!userId) return next(new Error("Token inválido o usuario no autenticado"));

        const { torneo_id, contrasena } = req.body;

        const torneoData = await obtenerTorneoPorId(torneo_id);
        if (torneoData.torneo_en_curso) throw new BadRequest('El torneo ya está en curso');

        await verificarUsuarioInscrito(contrasena, userId);
        const participantes = await contarParticipantes(torneo_id);
        if (participantes.length == MAX_PARTICIPANTES) throw new BadRequest('Capacidad máxima alcanzada');

        validarContrasena(torneoData, contrasena);
        await registrarParticipante(userId, torneo_id);

        const iniciado = await iniciarTorneoSiCompleto(torneo_id);
        const mensaje = iniciado 
            ? '¡Torneo iniciado automáticamente al completarse!' 
            : 'Te has unido al torneo correctamente';

        return sendResponse(req, res, { 
            success: true,
            message: mensaje,
            data: objectToJson(torneoData),
            iniciado
        });
    } catch (error) {
        console.error("Error en unirseTorneo:", error);
        return next(error);
    }
}

export async function obtenerTorneosActivos(req, res, next) {
    try {
        await getDecodedToken(req);
        const torneos = await obtenerTorneosSinGanador();
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
        const torneosJugados = await obtenerTorneosDeUsuario(userId);
        if (!torneosJugados.length) return next(new NotFound('No hay torneos jugados'));

        const torneosConInfo = [];
        for (const { torneo_id } of torneosJugados) {
            const info = await obtenerInfoTorneo(torneo_id);
            if (info) torneosConInfo.push(info);
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
        const { torneo_id } = req.params;
        if (!userId) return next(new Error("Token inválido o usuario no autenticado"));

        const torneoData = await obtenerTorneoPorId(torneo_id);
        const participantes = await obtenerDetallesParticipantes(torneo_id);

        return sendResponse(req, res, { 
            data: { torneo: torneoData, participantes } 
        });
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

        const torneoData = await validarInicioTorneo(userId, torneo_id);
        await marcarTorneoEnCurso(torneo_id);

        return sendResponse(req, res, { 
            message: 'Torneo iniciado correctamente',
            data: objectToJson(torneoData) 
        });
    } catch (error) {
        return next(error);
    }
}

export async function finalizarTorneo(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const { torneo_id, ganador_id } = req.body;

        const torneoData = await obtenerTorneoPorId(torneo_id);
        if (torneoData.creador_id !== token.id) {
            throw new BadRequest('Solo el creador del torneo puede finalizarlo');
        }

        await asignarGanador(torneo_id, ganador_id);
        return sendResponse(req, res, { message: 'Torneo finalizado correctamente' });
    } catch (error) {
        return next(error);
    }
}

async function realizarEmparejamientoInicial(torneoId, participantes) {
    // Implementación de emparejamiento
}