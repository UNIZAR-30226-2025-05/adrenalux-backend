import { app } from './api/app.js';
import { configureWebSocket } from './api/controllers/socket.js';

const port = app.get('port');

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

configureWebSocket(server);

export default server;