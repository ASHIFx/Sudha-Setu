import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket.js';

export default function useSocket(handlers = {}) {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const sock = getSocket();
    socketRef.current = sock;

    const attached = [];
    Object.entries(handlersRef.current).forEach(([event, handler]) => {
      const wrapper = (...args) => handlersRef.current[event]?.(...args);
      sock.on(event, wrapper);
      attached.push([event, wrapper]);
    });

    return () => {
      attached.forEach(([event, wrapper]) => sock.off(event, wrapper));
    };
  }, []);

  return socketRef;
}
