import {sendNotification} from './socket.js'
import { db } from '../config/db.js';
import { eq, and, or, not } from 'drizzle-orm';
import { user } from '../db/schemas/user.js';
import { amistad } from '../db/schemas/amistad.js';
import { sendResponse } from '../lib/http.js';
import { objectToJson } from '../lib/toJson.js';
import { getDecodedToken } from '../lib/jwt.js';


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
                message: `${sender.username} te ha enviado una solicitud de amistad`,
                avatar: sender.avatar,
                friend_code: sender.friend_code
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
        const friends = await db
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

        sendResponse(req, res, { data: friends });
    } catch (error) {
        console.error('Error getting friends:', error);
        sendResponse(req, res, { 
            status: 500,
            data: { message: 'Error al obtener amigos' } 
        });
    }
}