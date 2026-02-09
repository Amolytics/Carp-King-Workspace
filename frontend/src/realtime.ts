import { io } from 'socket.io-client';

// Default to same-origin (no host) so Vite proxy or Codespaces forwarded port
// handles the websocket upgrade. Use `VITE_SOCKET_URL` or `window.__SOCKET_URL__`
// to override if needed (the HTML boot script sets `window.__SOCKET_URL__`).
const socketUrl = ((typeof window !== 'undefined' && (window as any).__SOCKET_URL__) || import.meta.env.VITE_SOCKET_URL) ?? undefined;

export const socket = io(socketUrl, {
  // Prefer polling first so clients can connect in environments where
  // websocket upgrades are blocked by proxies (polling will then upgrade).
  transports: ['polling', 'websocket'],
  path: '/socket.io',
});
