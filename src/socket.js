import { io } from 'socket.io-client';
import { API_BASE_URL } from './config/api';

// Socket.io needs a long-lived server. On Vercel (same-origin /api), realtime is optional.
const canUseSocket =
  typeof window !== 'undefined' &&
  (Boolean(import.meta.env.VITE_API_URL) ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

export const socket = canUseSocket
  ? io(API_BASE_URL || 'http://localhost:5000', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    })
  : {
      connected: false,
      auth: {},
      connect() {},
      disconnect() {},
      emit() {},
      on() {},
      off() {},
    };
