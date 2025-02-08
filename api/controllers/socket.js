// api/lib/websocket.js
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid'; // Lo utilizaremos para generar IDs de sala unicos
import {socketAuth} from '../middlewares/socket_auth.js';

export function configureWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado');

    socket.on('disconnect', () => {
      console.log('Un usuario se ha desconectado');

    });
  });

  return io;
}
