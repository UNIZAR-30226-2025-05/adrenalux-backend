import { Server } from 'socket.io';
import {socketAuth} from '../middlewares/socket_auth.js';
import { db } from '../config/db.js'; 
import { eq, and } from 'drizzle-orm';
import { objectToJson } from '../lib/toJson.js';
import { carta } from '../db/schemas/carta.js';
import { coleccion } from '../db/schemas/coleccion.js';
import { user } from '../db/schemas/user.js';

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
    const { username } = socket.handshake.query; 
    socket.data.username = username; 
    
    connectedUsers.set(String(socket.data.userID), socket);

    console.log(`Usuario conectado: ${socket.data.userID}`);

    socket.on('request_exchange', ({ receptorId, solicitanteUsername }) => {
      const solicitanteId = String(socket.data.userID);
      const exchangeId = `${solicitanteId}-${receptorId}`;
  
      if (solicitanteId === receptorId) {
        return socket.emit('error', 'No puedes intercambiar contigo mismo');
      }

      const receptorSocket = connectedUsers.get(String(receptorId));
      
      if (!receptorSocket) {
          return socket.emit('error', 'El usuario no está conectado');
      }

      console.log("Enviando invitacion de intercambio con id ", exchangeId);

      activeExchanges.set(exchangeId, {
          roomId: `exchange_${exchangeId}`,
          participants: [String(solicitanteId), String(receptorId)],
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

      if (!solicitanteSocket.rooms.has(intercambio.roomId)) {
        solicitanteSocket.join(intercambio.roomId);
      }
      
      if (!receptorSocket.rooms.has(intercambio.roomId)) {
        receptorSocket.join(intercambio.roomId);
      }

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

      exchange.selectedCard[userId] = card;
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
        const user1Card = exchange.selectedCard[user1];
        const user2Card = exchange.selectedCard[user2];

        handleCardExchange(io, exchangeId, user1, user2, user1Card.id, user2Card.id);
      }
    });

    socket.on('cancel_confirmation', (exchangeId) => {
      const userId = String(socket.data.userID);
      const exchange = activeExchanges.get(exchangeId);
    
      if (!exchange || exchange.estado !== 'activo') {
        return socket.emit('error', 'Intercambio no válido');
      }
    
      exchange.confirmations[userId] = false;
      
      io.to(exchange.roomId).emit('confirmation_updated', {
        exchangeId,
        confirmations: exchange.confirmations
      });
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
      socket.rooms.forEach(room => socket.leave(room));
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

async function handleCardExchange(io, exchangeId, user1, user2, user1Card, user2Card) {
  const exchange = activeExchanges.get(exchangeId);
  try {
    const [user1Collection] = await db.select()
        .from(coleccion)
        .where(and(eq(coleccion.user_id, user1), eq(coleccion.carta_id, user1Card)));

    const [user2Collection] = await db.select()
        .from(coleccion)
        .where(and(eq(coleccion.user_id, user2), eq(coleccion.carta_id, user2Card)));

    console.log("User1: ", user1, user1Collection);
    console.log("User2: ", user2, user2Collection);
    if (!user1Collection || !user2Collection) {
      console.log("Una o ambas cartas no están disponibles para intercambio");
      throw new Error('Una o ambas cartas no están disponibles para intercambio');
    }

    await db.transaction(async (tx) => {
        // Quitar cartas a los usuarios
        if (user1Collection.cantidad === 1) {
          console.log("Borrando carta de ", user1);
          await tx.delete(coleccion)
              .where(and(eq(coleccion.user_id, user1), eq(coleccion.carta_id, user1Card)));
  
        } else {
          console.log("Restando uno a carta de ", user1);
          await tx.update(coleccion)
              .set({ cantidad: user1Collection.cantidad - 1 })
              .where(and(eq(coleccion.user_id, user1),eq(coleccion.carta_id, user1Card)));
        }

        if (user2Collection.cantidad === 1) {
          console.log("Borrando carta de ", user2);
          await tx.delete(coleccion)
              .where(and(eq(coleccion.user_id, user2), eq(coleccion.carta_id, user2Card)));
        } else {
          console.log("Restando uno a carta de ", user2);
          await tx.update(coleccion)
              .set({ cantidad: user2Collection.cantidad - 1 })
              .where(and(eq(coleccion.user_id, user2), eq(coleccion.carta_id, user2Card)));
        }

        // Añadir cartas a los usuarios
        const [user1NewCard] = await tx.select()
            .from(coleccion)
            .where(and(eq(coleccion.user_id, user1) , eq(coleccion.carta_id, user2Card)));

        const [user2NewCard] = await tx.select()
        .from(coleccion)
        .where(and(eq(coleccion.user_id, user2) , eq(coleccion.carta_id, user1Card)));

        if (user1NewCard) {
          console.log("Sumando uno a carta de usuario1 ", user1, user1NewCard);
          await tx.update(coleccion)
              .set({ cantidad: user1NewCard.cantidad + 1 })
              .where(and(eq(coleccion.user_id, user1) , eq(coleccion.carta_id, user2Card)));
        } else {
          console.log("Insertando carta a usuario1 ", user1);
          await tx.insert(coleccion).values({
              user_id: user1,
              carta_id: user2Card,
              cantidad: 1
          });
        }
        
        console.log("User1: ", user1);
        console.log("User2: ", user2);
        if (user2NewCard) {
          console.log("Sumando uno a carta a usuario 2 ", user2, user2NewCard);
          await tx.update(coleccion)
              .set({ cantidad: user2NewCard.cantidad + 1 })
              .where(and(eq(coleccion.user_id, user2) , eq(coleccion.carta_id, user1Card)));
        } else {
          console.log("Insertando carta a usuario 2 ", user2);
          await tx.insert(coleccion).values({
              user_id: user2,
              carta_id: user1Card,
              cantidad: 1
          });
        }
    });

    io.to(exchange.roomId).emit('exchange_completed', {
        exchangeId,
        message: 'Intercambio realizado con éxito',
        user1Card,
        user2Card
    });

  } catch (error) {
    io.to(exchange.roomId).emit('exchange_error', {
        exchangeId,
        message: 'Error en el intercambio: ' + error.message
    });
  } finally {
    activeExchanges.delete(exchangeId);
    exchange.participants.forEach(participantId => {
        connectedUsers.get(participantId)?.leave(exchange.roomId);
    });
  }
}