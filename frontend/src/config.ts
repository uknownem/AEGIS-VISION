// Configuration for Backend REST & WebSocket Endpoints

const defaultApiHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : 'http://localhost:8000';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || defaultApiHost).replace(/\/$/, '');

export const WS_BASE_URL = import.meta.env.VITE_WS_URL || (
  API_BASE_URL.startsWith('https://') 
    ? API_BASE_URL.replace('https://', 'wss://') + '/ws/stream'
    : API_BASE_URL.replace('http://', 'ws://') + '/ws/stream'
);
