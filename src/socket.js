import { io } from 'socket.io-client';
import { API_BASE_URL } from './config/api';

const host = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalHost = host === 'localhost' || host === '127.0.0.1';
const envUrl = String(import.meta.env.VITE_API_URL || '').trim();
const envIsRemoteApi = Boolean(envUrl) && !/localhost|127\.0\.0\.1/i.test(envUrl);

// Socket.io needs a long-lived Node server. Skip on Vercel serverless.
const canUseSocket = isLocalHost || envIsRemoteApi;

const socketUrl = isLocalHost
  ? API_BASE_URL || 'http://localhost:5000'
  : envIsRemoteApi
    ? envUrl.replace(/\/$/, '')
    : '';

export const socket = canUseSocket && socketUrl
  ? io(socketUrl, {
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
