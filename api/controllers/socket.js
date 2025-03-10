import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid'; // Lo utilizaremos para generar IDs de sala unicos
import {socketAuth} from '../middlewares/socket_auth.js';
import { db } from '../config/db.js'; 
import { eq } from 'drizzle-orm';
import { objectToJson } from '../lib/toJson.js';
import { carta } from '../db/schemas/carta.js';

const connectedUsers = new Map();
const activeExchanges = new Map();

export function configureWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {

    connectedUsers.set(String(socket.data.userID), socket);
    
    const { username } = socket.handshake.query; 
    socket.data.username = username; 

    console.log(`Usuario conectado: ${socket.data.userID}`);
  
    connectedUsers.set(String(socket.data.userID), socket);

    socket.on('request_exchange', ({ receptorId, solicitanteUsername }) => {
      const solicitanteId = String(socket.data.userID);
      const exchangeId = `${solicitanteId}-${receptorId}`;
  
      if (solicitanteId === receptorId) {
        return socket.emit('error', 'No puedes intercambiar contigo mismo');
      }

      const receptorSocket = connectedUsers.get(receptorId);
      
      if (!receptorSocket) {
          return socket.emit('error', 'El usuario no está conectado');
      }

      console.log("Enviando invitacion de intercambio con id ", exchangeId);

      activeExchanges.set(exchangeId, {
          roomId: `exchange_${exchangeId}`,
          participants: [solicitanteId, receptorId],
          estado: 'pendiente',
          selectedCards: {},
          confirmations: {},
      });

      receptorSocket.emit('request_exchange_received', {
          exchangeId,
          solicitanteId,
          solicitanteUsername,
          timestamp: new Date().toISOString()
      });
    });

    socket.on('accept_exchange', (exchangeId) => {
      const userId = String(socket.data.userID);
      const intercambio = activeExchanges.get(exchangeId);
  
      if (!intercambio || intercambio.participants[1] !== userId) {
        return socket.emit('error', 'Intercambio no válido');
      }
      const solicitanteId = intercambio.participants[0];
      const receptorId = intercambio.participants[1];

      const solicitanteSocket = connectedUsers.get(intercambio.participants[0]);
      const receptorSocket = connectedUsers.get(intercambio.participants[1]);

      const solicitanteUsername = solicitanteSocket?.data.username || 'Usuario';
      const receptorUsername = receptorSocket?.data.username || 'Usuario';
  
      intercambio.estado = 'activo';
      intercambio.selectedCard = {
        [solicitanteId]: [],
        [receptorId]: []
      };
      intercambio.confirmations = {
        [solicitanteId]: false,
        [receptorId]: false
      };

      
      solicitanteSocket?.join(intercambio.roomId);
      receptorSocket?.join(intercambio.roomId);

      io.to(intercambio.roomId).emit('exchange_accepted', {
        exchangeId,
        roomId: intercambio.roomId,
        solicitanteUsername: solicitanteUsername,
        receptorUsername: receptorUsername, 
      });
    });

    socket.on('select_cards', async ({ exchangeId, cardId }) => {
      const userId = String(socket.data.userID);
      const exchange = activeExchanges.get(exchangeId);

      const cards = await db.select().from(carta).where(eq(carta.id, cardId));
      const card = cards[0];  

      if (!exchange || exchange.estado !== 'activo') {
        return socket.emit('error', 'Intercambio no válido');
      }

      if (!exchange.participants.includes(userId)) {
        return socket.emit('error', 'No eres parte de este intercambio');
      }

      exchange.selectedCard[userId] = cardId;
      exchange.confirmations[userId] = false;

      io.to(exchange.roomId).emit('cards_selected', {
        exchangeId,
        userId,
        card : objectToJson(card),
      });
    });

    socket.on('confirm_exchange', (exchangeId) => {
      const userId = String(socket.data.userID);
      const exchange = activeExchanges.get(exchangeId);

      if (!exchange || exchange.estado !== 'activo') {
        return socket.emit('error', 'Intercambio no válido');
      }

      exchange.confirmations[userId] = !exchange.confirmations[userId];
      
      io.to(exchange.roomId).emit('confirmation_updated', {
        exchangeId,
        confirmations: exchange.confirmations
      });

      const bothConfirmed = exchange.participants.every(
        participant => exchange.confirmations[participant]
      );

      if (bothConfirmed) {
        const [user1, user2] = exchange.participants;
        const user1Cards = exchange.selectedCard[user1];
        const user2Cards = exchange.selectedCard[user2];

        io.to(exchange.roomId).emit('exchange_completed', {
          exchangeId,
          message: 'Intercambio realizado con éxito',
          user1Cards,
          user2Cards
        });

        activeExchanges.delete(exchangeId);
        exchange.participants.forEach(participantId => {
          connectedUsers.get(participantId)?.leave(exchange.roomId);
        });
      }
    });

    socket.on('cancel_exchange', (exchangeId) => {
      const userId = String(socket.data.userID);
      const exchange = activeExchanges.get(exchangeId);

      if (!exchange || !exchange.participants.includes(userId)) {
        return socket.emit('error', 'Intercambio no válido');
      }

      io.to(exchange.roomId).emit('exchange_cancelled', {
        exchangeId,
        message: 'Intercambio cancelado'
      });

      activeExchanges.delete(exchangeId);
      exchange.participants.forEach(participantId => {
        connectedUsers.get(participantId)?.leave(exchange.roomId);
      });
    });
    
    socket.on('disconnect', () => {
      connectedUsers.delete(String(socket.data.userID));
      console.log(`Usuario desconectado: ${socket.data.userID}`);
    });

    
  });

  return io;
}

export function sendNotification(toUserId, type, data) {
  const targetSocket = connectedUsers.get(String(toUserId));
  if (targetSocket) {
    targetSocket.emit('notification', {
      message: data['message'],
      data: {
          requestId: data['id'],
          type: type,
          timestamp: new Date().toISOString()
      }
  });
  } 
}

export function isConnected(userId) {
  return connectedUsers.has(String(userId));
}
