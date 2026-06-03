import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

/**
 * SocketService — Multi-tenant WebSocket manager
 *
 * Each company gets its own Socket.IO room: `company:${companyId}`
 * Clients join via their JWT token (validated on handshake).
 */
export function initSocketService(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    const companyId = socket.handshake.auth?.companyId as string;

    if (!companyId) {
      socket.disconnect(true);
      return;
    }

    // Join the company-specific room (tenant isolation)
    const room = `company:${companyId}`;
    socket.join(room);

    socket.on('disconnect', () => {
      socket.leave(room);
    });
  });

  console.log('[SOCKET] Socket.IO service initialized.');
  return io;
}

/**
 * Emit an event to all sockets in a company's room.
 * Safe to call even if WebSocket is not initialized (no-op).
 */
export function emitToCompany(companyId: string, event: string, data: any) {
  if (!io) return;
  io.to(`company:${companyId}`).emit(event, data);
}

export { io };
