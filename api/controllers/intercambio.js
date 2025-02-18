import {sendNotification} from './socket.js'
import { db } from '../config/db.js';
import { eq } from 'drizzle-orm';
import { user } from '../db/schemas/user.js';

export async function enviarInvitacion(req, res) {
    const { recipientId } = req.body;
    const senderId = req.user.id;

    /**
    const [sender] = await db
        .select({ 
            name: users.name,
            lastname: users.lastname
        })
        .from(users)
        .where(eq(users.id, senderId));

    if (!sender) {
        return res.status(404).json({ 
            success: false,
            message: 'Usuario remitente no encontrado' 
        });
    }
    **/
   //sender.username
    sendNotification(recipientId, "exchange", senderId);
    res.json({ success: true });
}