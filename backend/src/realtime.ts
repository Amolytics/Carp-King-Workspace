import { Server } from 'socket.io';

let io: Server | null = null;

export function setIo(server: Server) {
  io = server;
}

export function emit(event: string, payload: unknown) {
  if (io) {
    io.emit(event, payload);
  }
}
