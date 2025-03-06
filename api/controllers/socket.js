import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid'; // Lo utilizaremos para generar IDs de sala unicos
import {socketAuth} from '../middlewares/socket_auth.js';

const connectedUsers = new Map();

export function configureWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.data.userID}`);
  
    // Guardar conexión
    connectedUsers.set(socket.data.userID, socket);
    
    socket.on('disconnect', () => {
      connectedUsers.delete(socket.data.userID);
      console.log(`Usuario desconectado: ${socket.data.userID}`);
    });

    
  });

  return io;
}

export function sendNotification(toUserId, type, data) {
  const targetSocket = connectedUsers.get(toUserId);
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
  return connectedUsers.has(userId);
}
