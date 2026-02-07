import { io } from 'socket.io-client';

// Default to same-origin (no host) so Vite proxy or Codespaces forwarded port
// handles the websocket upgrade. Use `VITE_SOCKET_URL` to override if needed.
const socketUrl = import.meta.env.VITE_SOCKET_URL ?? undefined;

export const socket = io(socketUrl, {
  // allow polling fallback in environments (Codespaces/proxies) that block
  // pure websocket upgrades — socket.io will negotiate the best transport.
  transports: ['websocket', 'polling'],
  path: '/socket.io',
});
