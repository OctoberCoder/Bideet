import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';

let socket: Socket | null = null;

/** A single shared connection for the whole app — auction rooms are joined/left per screen. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE_URL, { transports: ['websocket'], autoConnect: true });
  }
  return socket;
}
