import { getDecodedToken } from '../lib/jwt.js';
import { configureWebSocket, sendNotification, isConnected } from './socket.js';

const intercambiosPendientes = {};


export const solicitarIntercambio = async (req, res, next) => {
    try {
        const decodedToken = await getDecodedToken(req);
        const solicitanteId = decodedToken.id;
        const { userId } = req.params;

        if (solicitanteId === userId) {
            return res.status(400).json({ message: 'No puedes intercambiar contigo mismo' });
        }

        const exchangeId = `${solicitanteId}-${userId}`;
        intercambiosPendientes[exchangeId] = {
            solicitanteId,
            receptorId: userId,
            estado: 'pendiente'
        };

        if (isConnected(userId)) {
            sendNotification(userId, 'exchange', {
                message: 'Tienes una solicitud de intercambio',
                id: exchangeId,
            });
        }

        res.status(200).json({ message: 'Intercambio solicitado exitosamente', exchangeId });
    } catch (error) {
        next(error);
    }
};



export const aceptarIntercambio = async (req, res, next) => {
    try {
        const decodedToken = await getDecodedToken(req);
        const userId = decodedToken.id;
        const { exchangeId } = req.body;

        if (!intercambiosPendientes[exchangeId] || intercambiosPendientes[exchangeId].receptorId !== userId) {
            return res.status(400).json({ message: 'Intercambio no encontrado o no autorizado' });
        }

        intercambiosPendientes[exchangeId].estado = 'aceptado';

        if (isConnected(intercambiosPendientes[exchangeId].solicitanteId)) {
            sendNotification(intercambiosPendientes[exchangeId].solicitanteId, 'exchange', {
                message: 'Tu solicitud de intercambio ha sido aceptada',
                id: exchangeId,
            });
        }

        res.status(200).json({ message: 'Intercambio aceptado' });
    } catch (error) {
        next(error);
    }
};


export const rechazarIntercambio = async (req, res, next) => {
    try {
        const decodedToken = await getDecodedToken(req);
        const userId = decodedToken.id;
        const { exchangeId } = req.body;

        if (!intercambiosPendientes[exchangeId] || intercambiosPendientes[exchangeId].receptorId !== userId) {
            return res.status(400).json({ message: 'Intercambio no encontrado o no autorizado' });
        }

        intercambiosPendientes[exchangeId].estado = 'rechazado';

        if (isConnected(intercambiosPendientes[exchangeId].solicitanteId)) {
            sendNotification(intercambiosPendientes[exchangeId].solicitanteId, 'exchange', {
                message: 'Tu solicitud de intercambio ha sido rechazada',
                id: exchangeId,
            });
        }

        res.status(200).json({ message: 'Intercambio rechazado' });

        delete intercambiosPendientes[exchangeId];
    } catch (error) {
        next(error);
    }
};


export const solicitarIntercambioAleatorio = async (req, res, next) => {
    try {
        const decodedToken = await getDecodedToken(req);
        const solicitanteId = decodedToken.id;

        const usuariosConectados = Array.from(io.sockets.sockets.keys()).filter(id => id !== solicitanteId);
        if (usuariosConectados.length === 0) {
            return res.status(404).json({ message: 'No hay usuarios disponibles para intercambio' });
        }

        const receptorId = usuariosConectados[Math.floor(Math.random() * usuariosConectados.length)];
        const exchangeId = `${solicitanteId}-${receptorId}`;
        intercambiosPendientes[exchangeId] = { solicitanteId, receptorId, estado: 'pendiente' };

        if (isConnected(receptorId)) {
            sendNotification(receptorId, 'exchange', {
                message: 'Tienes una solicitud de intercambio aleatorio',
                id: exchangeId,
            });
        }

        res.status(200).json({ message: 'Intercambio aleatorio solicitado', exchangeId });
    } catch (error) {
        next(error);
    }
};
