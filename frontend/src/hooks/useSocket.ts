import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

let globalSocket: Socket | null = null;

export const useSocket = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(globalSocket);

  useEffect(() => {
    if (!user || !user.companyId) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        setSocket(null);
      }
      return;
    }

    if (!globalSocket) {
      const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : window.location.origin;

      const token = localStorage.getItem('@Lanchonete:token');

      globalSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
        autoConnect: true,
      });

      globalSocket.on('connect', () => {
        console.log('⚡ Connected to WebSocket server');
        globalSocket?.emit('join_company', { companyId: user.companyId });
      });

      globalSocket.on('disconnect', () => {
        console.log('⚡ Disconnected from WebSocket server');
      });
    } else {
      if (globalSocket.connected) {
        globalSocket.emit('join_company', { companyId: user.companyId });
      }
    }

    setSocket(globalSocket);
  }, [user]);

  return socket;
};
