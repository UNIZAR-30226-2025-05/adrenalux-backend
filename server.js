import https from 'https';
import fs from 'fs';
import { app } from './api/app.js';
import { configureWebSocket } from './api/controllers/socket.js';
import * as dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 3000;

const httpsOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/adrenalux.duckdns.org/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/adrenalux.duckdns.org/fullchain.pem')
};

const server = https.createServer(httpsOptions, app);

server.listen(port, () => {
  console.log(`Servidor HTTPS escuchando en el puerto ${port}`);
});

configureWebSocket(server);

export default server;
