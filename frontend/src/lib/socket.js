import { io } from 'socket.io-client';

let socket = null;
const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
const socketUrl = import.meta.env.VITE_SOCKET_URL ||
  (apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : window.location.origin);

export function getSocket(accessToken) {
  if (socket && socket.connected) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(socketUrl, {
    withCredentials: true,
    auth: accessToken ? { token: accessToken } : {},
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
