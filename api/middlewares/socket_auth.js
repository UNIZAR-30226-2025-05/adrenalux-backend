/**
 * Middleware de autenticación para WebSockets.
 * @param {import("socket.io").Socket} socket - Objeto del socket.
 * @param {Function} next - Función para continuar con la conexión.
 */
import { verifyToken } from '../lib/jwt.js';

export const socketAuth = async (socket, next) => {
    try {
      const token = socket.handshake.headers.token || socket.handshake.auth.token 
      || socket.handshake.query.token || socket.request.cookies['api-auth'];

      if (!token) {
        console.log('No token provided')
        return next(new Error('No token provided'));
      }
  
      const decoded = await verifyToken(token, process.env.SECRET_KEY);

      socket.data.authenticated = true;
      socket.data.userID = decoded.id;

      return next();

    } catch (err) {
      console.log('Authentication failed', err)
      return next(new Error('Authentication failed'));
    }
  };
  