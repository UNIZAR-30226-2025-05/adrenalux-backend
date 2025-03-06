import {sendNotification} from './socket.js'
import { db } from '../config/db.js';
import { eq, and, or, not } from 'drizzle-orm';
import { user } from '../db/schemas/user.js';
import { amistad } from '../db/schemas/amistad.js';
import { sendResponse } from '../lib/http.js';
import { objectToJson } from '../lib/toJson.js';
import { getDecodedToken } from '../lib/jwt.js';
import { isConnected } from './socket.js';
import { partida } from '../db/schemas/partida.js';
import { logro } from '../db/schemas/logro.js';
import { logrosUsuario } from '../db/schemas/logrosUsuario.js';
import{calcularXpNecesaria} from '../lib/exp.js';


export async function getFriendRequests(req, res) {
    const token = await getDecodedToken(req);
    const userId = token.id;

    try {
        const receivedRequests = await db
            .select({
                request_id: amistad.user1_id, 
                created_at: amistad.created_at,
                sender: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    lastname: user.lastname,
                    avatar: user.avatar,
                    friend_code: user.friend_code,
                    level: user.level
                }
            })
            .from(amistad)
            .innerJoin(
                user,
                eq(amistad.user1_id, user.id)
            )
            .where(
                and(
                    eq(amistad.user2_id, userId), 
                    eq(amistad.estado, 'pendiente')
                )
            );

        res.status(200).json({
            success: true,
            data: receivedRequests.map(request => ({
                id: `${request.request_id}-${userId}`, 
                sender: objectToJson(request.sender),
                created_at: request.created_at
            }))
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener solicitudes pendientes',
            error: error.message
        });
    }
}

export async function sendInvitation(req, res) {
    const { friendCode } = req.body; 
    const token = await getDecodedToken(req);
    const senderId = token.id;

    try {
        const [recipient] = await db
            .select({ 
                id: user.id,
                friend_code: user.friend_code 
            })
            .from(user)
            .where(eq(user.friend_code, friendCode));

        if (!recipient) {
            return sendResponse(req, res, {
                status: 404,
                data: { 
                    success: false,
                    message: "Usuario con este código de amigo no encontrado" 
                }
            });
        }

        const recipientId = recipient.id;

        if (senderId === recipientId) {
            return sendResponse(req, res, {
                status: 400,
                data: { 
                    success: false,
                    message: "No puedes enviarte una invitación a ti mismo" 
                }
            });
        }

        const existingFriendship = await db
            .select()
            .from(amistad)
            .where(
                and(
                    or(
                        and(
                            eq(amistad.user1_id, senderId),
                            eq(amistad.user2_id, recipientId)
                        ),
                        and(
                            eq(amistad.user1_id, recipientId),
                            eq(amistad.user2_id, senderId)
                        )
                    ),
                    eq(amistad.estado, 'aceptada')
                )
            );

        if (existingFriendship.length > 0) {
            return sendResponse(req, res, {
                status: 409,
                data: { 
                    success: false,
                    message: "Ya eres amigo de este usuario" 
                }
            });
        }

        const deleteCondition = and(
            or(
                and(
                    eq(amistad.user1_id, senderId),
                    eq(amistad.user2_id, recipientId)
                ),
                and(
                    eq(amistad.user1_id, recipientId),
                    eq(amistad.user2_id, senderId)
                )
            ),
            eq(amistad.estado, 'pendiente')
        );

        await db.delete(amistad).where(deleteCondition);

        await db.insert(amistad).values({
            user1_id: senderId,
            user2_id: recipientId,
            estado: 'pendiente',
            created_at: new Date().toISOString()
        });

        const [sender] = await db
            .select({ 
                username: user.username,
                avatar: user.avatar 
            })
            .from(user)
            .where(eq(user.id, senderId));

        sendNotification(
            recipientId,
            "friend_request",
            {
                id: `${senderId}-${recipientId}`,
                message: `${sender.username} te ha enviado una solicitud de amistad`,
            }
        );

        sendResponse(req, res, { 
            data: { 
                success: true,
                message: "Invitación enviada correctamente" 
            } 
        });

    } catch (error) {
        sendResponse(req, res, {
            status: 500,
            data: { 
                success: false,
                message: "Error al procesar la invitación",
                error: error.message 
            }
        });
    }
}

export async function getFriends(req, res) {
    const token = await getDecodedToken(req);
    const userId = token.id;

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
            isConnected: isConnected(friend.id)
            }));

        sendResponse(req, res, { data: friends });
    } catch (error) {
        console.error('Error getting friends:', error);
        sendResponse(req, res, { 
            status: 500,
            data: { message: 'Error al obtener amigos' } 
        });
    }
}


export async function acceptRequest(req, res) {
    const token = await getDecodedToken(req);
    const currentUserId = token.id;
    const requestId = req.params.requestId;
    
    const [senderId, recipientId] = requestId.split('-').map(Number);

    if (currentUserId !== recipientId) {
        return res.status(403).json({
            success: false,
            message: 'No tienes permiso para aceptar esta solicitud'
        });
    }

    try {
        const [request] = await db.select()
        .from(amistad)
        .where(
            and(
                eq(amistad.user1_id, senderId),
                eq(amistad.user2_id, recipientId),
                eq(amistad.estado, 'pendiente')
            )
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada o ya fue procesada'
            });
        }

        await db.update(amistad)
        .set({ estado: 'aceptada', created_at: new Date().toISOString() })
        .where(
            and(
                eq(amistad.user1_id, senderId),
                eq(amistad.user2_id, recipientId)
            )
        );

        res.json({
            success: true,
            message: 'Solicitud aceptada correctamente',
            data: {
                friendship_id: `${recipientId}-${senderId}`
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al aceptar solicitud',
            error: error.message
        });
    }
}

export async function declineRequest(req, res) {
    const token = await getDecodedToken(req);
    const currentUserId = token.id;
    const requestId = req.params.requestId;
    const [senderId, recipientId] = requestId.split('-').map(Number);

    if (currentUserId !== recipientId) {
        return res.status(403).json({
            success: false,
            message: 'No tienes permiso para rechazar esta solicitud'
        });
    }
    try {
        const result = await db.delete(amistad)
        .where(
            and(
                eq(amistad.user1_id, senderId),
                eq(amistad.user2_id, recipientId),
                eq(amistad.estado, 'pendiente')
            )
        ).returning();

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada o ya fue procesada'
            });
        }

        res.json({
            success: true,
            message: 'Solicitud rechazada y eliminada',
            data: {
                request_id: requestId
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al rechazar solicitud',
            error: error.message
        });
    }
}

export async function deleteFriend(req, res) {
    const token = await getDecodedToken(req);
    const currentUserId = token.id;
    const friendId = Number(req.params.friendId);
    try {
        const result = await db.delete(amistad)
        .where(
            and(
                eq(amistad.user1_id, currentUserId),
                eq(amistad.user2_id, friendId),
                eq(amistad.estado, 'aceptada')
            )
        ).returning();

        await db.delete(amistad)
        .where(
            and(
                eq(amistad.user1_id, friendId),
                eq(amistad.user2_id, currentUserId),
                eq(amistad.estado, 'aceptada')
            )
        ).returning();

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró la amistad o ya fue eliminada'
            });
        }

        res.json({
            success: true,
            message: 'Amistad eliminada correctamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar amigo',
            error: error.message
        });
    }
}

export async function getFriendData(req, res, next) {
    try {
        const friendId = Number(req.params.friendId);

        const [amigo] = await db.select().from(user).where(eq(user.id, friendId));
        if (!amigo) return next(new NotFound('Amigo no encontrado'));

        let logros = [];
        try {
            logros = await db
                .select()
                .from(logrosUsuario)
                .leftJoin(logro, eq(logrosUsuario.logro_id, logro.id))
                .where(eq(logrosUsuario.user_id, friendId));

            if (logros.length === 0) {
                console.log('El amigo no tiene logros.');
            }
        } catch (logrosError) {
            console.error('Error al obtener logros:', logrosError);
            return next(logrosError);
        }

        let partidas = [];
        try {
            partidas = await db
                .select()
                .from(partida)
                .where(or(
                    eq(partida.user1_id, friendId),
                    eq(partida.user2_id, friendId)
                ));

            if (partidas.length === 0) {
                console.log('El amigo no tiene partidas.');
            }
        } catch (partidasError) {
            console.error('Error al obtener partidas:', partidasError);
            return next(partidasError);
        }

        const amigoJson = objectToJson(amigo);
        const logrosJson = logros.map(logro => objectToJson(logro));
        const partidasJson = partidas.map(partida => objectToJson(partida));
        const xpMax = calcularXpNecesaria(amigo.level);

        const responseJson = {
            ...amigoJson,
            logros: logrosJson,
            partidas: partidasJson,
            xpMax: xpMax,
        };

        return sendResponse(req, res, { data: responseJson });
    } catch (err) {
        console.error("Error inesperado:", err);
        next(err);
    }
}
