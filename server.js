import { createServer } from 'http'; 
import { app } from './api/app.js';
import { configureWebSocket } from './api/controllers/socket.js';
import * as dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 3000;

const httpServer = createServer(app); 

configureWebSocket(httpServer); 

httpServer.listen(port, '0.0.0.0', () => { 
  console.log(`Backend y WebSocket escuchando en puerto ${port}`);
});

export default httpServer; 