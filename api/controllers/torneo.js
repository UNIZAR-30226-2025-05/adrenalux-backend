import { user } from '../db/schemas/user.js';
import { torneo } from '../db/schemas/torneo.js';
import { participacionTorneo } from '../db/schemas/participacionTorneo.js';
import { db } from '../config/db.js';
import { sendResponse, NotFound, BadRequest } from '../lib/http.js';
import { getDecodedToken } from '../lib/jwt.js';
import { objectToJson } from '../lib/toJson.js';
import { eq, and, isNull, or } from 'drizzle-orm';
import { amistad } from '../db/schemas/amistad.js';
import { partida } from '../db/schemas/partida.js';
import { MAX_PARTICIPANTES } from '../config/torneos.config.js';
import {getPlantilla} from './socket.js';



function validarDatosCreacion({ nombre, premio, descripcion }) {
    if (!nombre || !premio || !descripcion) {
        throw new BadRequest("Faltan campos obligatorios (nombre, premio, descripcion)");
    }
}

async function crearTorneoEnDB({userId, nombre, contrasena, premio, descripcion }) {
    await db.insert(torneo).values({
        nombre: nombre,
        contrasena: contrasena || null,
        premio : premio,
        descripcion:  descripcion,
        fecha_inicio: null,
        torneo_en_curso: false,
        creador_id: userId,
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
    const torneoData = await obtenerTorneoPorId(torneoId);
    const participantes = await contarParticipantes(torneoId);

    if (!torneoData.torneo_en_curso && participantes.length === MAX_PARTICIPANTES) {
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
    if (torneoData.torneo_en_curso) throw new BadRequest('El torneo ya está en curso');
    if (torneoData.creador_id !== userId) throw new BadRequest('No tienes permiso para iniciar este torneo');
    
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
        if (!userId) {
            return next(new Error("Token inválido o usuario no autenticado"));
        }
        const { nombre, contrasena, premio, descripcion } = req.body;

        validarDatosCreacion(req.body);
        const torneoCreado = await crearTorneoEnDB({userId, nombre, contrasena, premio, descripcion });
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

        await verificarUsuarioInscrito(torneo_id, userId);
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


export async function obtenerTorneosDeAmigos(req, res, next) {
    try {
        console.log("Obteniendo token...");
        const token = await getDecodedToken(req);
        const userId = token.id;
        console.log("User ID:", userId);

        const torneoAmigos = [];
        const torneosConDetalles = []; 

        console.log("Buscando amigos aceptados...");
        const rawFriends = await db
            .select({
                id: user.id,
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

        console.log("Amigos encontrados:", rawFriends);

        for (const amigo of rawFriends) {
            console.log(`Buscando torneos para amigo ID: ${amigo.id}`);
            const torneosAmigo = await db.select()
                .from(participacionTorneo)
                .where(eq(participacionTorneo.user_id, amigo.id));
            console.log(`Torneos encontrados para ${amigo.id}:`, torneosAmigo);
            torneoAmigos.push(...torneosAmigo); 
        }

        console.log("Obteniendo torneos activos...");
        const torneosActivos = await obtenerTorneosSinGanador();
        console.log("Torneos activos:", torneosActivos);

        console.log("Filtrando torneos de amigos...");
        const torneosFiltrados = torneosActivos.filter(torneoActivo => 
            torneoAmigos.some(torneoAmigo => torneoAmigo.torneo_id === torneoActivo.id));
        console.log("Torneos filtrados:", torneosFiltrados);

        if (torneosFiltrados.length === 0) {
            console.log("No se encontraron torneos de amigos.");
            return res.status(204).send();
        }

        for (const torneo of torneosFiltrados) {
            console.log(`Obteniendo detalles para torneo ID: ${torneo.id}`);
            const info = await obtenerInfoTorneo(torneo.id);
            const detalles = await obtenerDetallesParticipantes(torneo.id);
            torneosConDetalles.push(info, detalles);
        }

        console.log("Torneos con detalles:", torneosConDetalles);

        return sendResponse(req, res, { 
            data: torneosConDetalles.map(objectToJson) 
        });

    } catch (error) {
        console.error("[ERROR] Error en obtenerTorneosDeAmigos:", error);
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
            const participantes = await obtenerDetallesParticipantes(torneo_id);
             const InfoTorneo = {
                infoTorneo : info,
                 numParticipantes : participantes.length,
            }
            if (InfoTorneo) torneosConInfo.push(InfoTorneo);
        }

        return sendResponse(req, res, { data: torneosConInfo });
    } catch (error) {
        return next(error);
    }
}

export async function obtenerDetallesTorneo(req, res, next) {
    try {
        
        const token = await getDecodedToken(req);
        console.log("[INFO] Token decodificado:", token);
        
        const userId = token.id;
        const { id } = req.params;
        
        if (!userId) {
            return next(new Error("Token inválido o usuario no autenticado"));
        }
        
        const torneoData = await obtenerTorneoPorId(id);
        if (!torneoData) {
            return next(new Error("Torneo no encontrado"));
        }
        const participantes = await obtenerDetallesParticipantes(id);
        return sendResponse(req, res, { 
            data: { torneo: torneoData, participantes } 
        });
    } catch (error) {
        console.error("[ERROR] Error en obtenerDetallesTorneo:", error);
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
        const participantesRaw = await contarParticipantes(torneo_id);
        const participantesIds = participantesRaw.map(p => p.user_id);
        await marcarTorneoEnCurso(torneo_id);
        await realizarEmparejamientoInicial(torneo_id, participantesIds);

        console.log("Torneo iniciado con éxito:", torneoData);

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
        if (!torneoData.torneo_en_curso) throw new BadRequest('El torneo no está en curso');
        await asignarGanador(torneo_id, ganador_id);
        return sendResponse(req, res, { message: 'Torneo finalizado correctamente' });
    } catch (error) {
        return next(error);
    }
}

export async function obtenerPartidasTorneo(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { id } = req.params;

        const torneoIdNumber = Number(id);
        if (isNaN(torneoIdNumber)) {
            return next(new BadRequest('ID de torneo inválido'));
        }

        const [torneoExistente] = await db.select()
            .from(torneo)
            .where(eq(torneo.id, torneoIdNumber));
        
        if (!torneoExistente) {
            return next(new NotFound('Torneo no encontrado'));
        }

        const [participacion] = await db.select()
            .from(participacionTorneo)
            .where(and(
                eq(participacionTorneo.user_id, Number(userId)), 
                eq(participacionTorneo.torneo_id, torneoIdNumber)
            ));

        if (!participacion) {
            return next(new Forbidden('No estás participando en este torneo'));
        }

        const allMatches = await db.select()
            .from(partida)
            .where(eq(partida.torneo_id, torneoIdNumber));

        return sendResponse(req, res, { 
            data: allMatches.map(objectToJson)
        });
    } catch (error) {
        return next(error);
    }
}

async function realizarEmparejamientoInicial(torneoId, participantes) {
    const parejas = await realizarEmparejamiento(participantes);
    for(const pareja of parejas) {
        await insertarPartida(pareja, torneoId);
        console.log(`Partida creada entre ${pareja[0]} y ${pareja[1]}`);
    }
}

async function realizarEmparejamiento(participantesIds) {
    const numParticipantes = participantesIds.length;
    if (numParticipantes % 2 !== 0) {
        throw new BadRequest('Número de participantes debe ser par');
    }
    
    const participantesMezclados = [...participantesIds].sort(() => Math.random() - 0.5);
    return participantesMezclados.reduce((acc, _, i, arr) => {
        if (i % 2 === 0) acc.push(arr.slice(i, i + 2));
        return acc;
    }, []);
}

async function insertarPartida(parejas, torneoId) {
    const [jugador1, jugador2] = parejas.map(Number);
    const plantilla1 = await getPlantilla(jugador1);
    const plantilla2 = await getPlantilla(jugador2);
    
    await db.insert(partida).values({
        turno: jugador1,
        user1_id: jugador1,
        user2_id: jugador2,
        plantilla1_id: plantilla1.plantillaId,
        plantilla2_id: plantilla2.plantillaId,
        estado: 'programada',
        fecha: new Date(Date.now() + 5 * 60 * 1000), 
        torneo_id: torneoId,
    });
}

export async function abandonarTorneo(req, res, next) {
    try {
        const token = await getDecodedToken(req);
        const userId = token.id;
        const { torneo_id } = req.body;
        
        if (!userId) return next(new Error("Token inválido o usuario no autenticado"));

        const [inscripcion] = await db.select()
            .from(participacionTorneo)
            .where(and(
                eq(participacionTorneo.torneo_id, torneo_id),
                eq(participacionTorneo.user_id, userId)
            ));
        
        if (!inscripcion) throw new BadRequest('No estás inscrito en este torneo');

        const [torneoData] = await db.select()
            .from(torneo)
            .where(eq(torneo.id, torneo_id));

        if (!torneoData) throw new BadRequest('El torneo no existe');

        if (torneoData.creador_id === userId) {
            await db.delete(torneo)
                .where(eq(torneo.id, torneo_id));
            
            return sendResponse(req, res, { 
                message: 'Torneo eliminado correctamente al abandonar' 
            });
        } else {
            await db.delete(participacionTorneo)
                .where(and(
                    eq(participacionTorneo.torneo_id, torneo_id),
                    eq(participacionTorneo.user_id, userId)
                ));
            
            return sendResponse(req, res, { 
                message: 'Has abandonado el torneo correctamente' 
            });
        }
    } catch (error) {
        return next(error);
    }
}