import { io } from 'socket.io-client';

let socket = null;

export function getSocket(accessToken) {
  if (socket && socket.connected) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(window.location.origin, {
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
