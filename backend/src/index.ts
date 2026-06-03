import http from 'http';
import app from './app';
import { env } from './config/env';
import { initSocketService } from './services/socket.service';

const server = http.createServer(app);

// Initialize WebSocket service (attached to the same HTTP server)
initSocketService(server);

server.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
  console.log(`📚 Swagger docs: http://localhost:${env.PORT}/api-docs`);
  console.log(`⚡ WebSocket: enabled (socket.io)`);
});
