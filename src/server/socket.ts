import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';

export const createSocketGateway = (server: HttpServer): Server => {
  const io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('trip:subscribe', (tripId: string) => socket.join(`trip:${tripId}`));
    socket.on('trip:unsubscribe', (tripId: string) => socket.leave(`trip:${tripId}`));
  });

  return io;
};
