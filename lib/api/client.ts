import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { client } from './generated/client.gen';

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'https://happiest-barracuda-sublease.ngrok-free.dev';
}

export const API_BASE_URL = getApiBaseUrl();

// ── DEBUG: remove after confirming Expo Go works ──
console.log('[API_CLIENT] Platform:', Platform.OS);
console.log('[API_CLIENT] hostUri:', Constants.expoConfig?.hostUri);
console.log('[API_CLIENT] manifest2 debuggerHost:', Constants.manifest2?.extra?.expoGo?.debuggerHost);
console.log('[API_CLIENT] manifest debuggerHost:', (Constants.manifest as any)?.debuggerHost);
console.log('[API_CLIENT] → API_BASE_URL:', API_BASE_URL);
// ── END DEBUG ──

client.setConfig({
  baseUrl: API_BASE_URL,
  throwOnError: true,
  responseStyle: 'data',
});

let activeToken: string | null = null;
let unauthorizedCallback: (() => void) | null = null;

export function setApiToken(token: string | null) {
  activeToken = token;
}

export function setUnauthorizedCallback(callback: () => void) {
  unauthorizedCallback = callback;
}

// Request interceptor for Bearer token
client.interceptors.request.use((request) => {
  console.log('[API_CLIENT] →', request.method, request.url); // DEBUG
  if (activeToken) {
    request.headers.set('Authorization', `Bearer ${activeToken}`);
  }
  // Bypass ngrok free-tier browser warning page
  request.headers.set('ngrok-skip-browser-warning', 'true');
  return request;
});

// Response interceptor for unauthorized status
client.interceptors.response.use((response) => {
  console.log('[API_CLIENT] ←', response.status, response.url); // DEBUG
  if (response.status === 401 && unauthorizedCallback) {
    unauthorizedCallback();
  }
  return response;
});

// Error interceptor — catches network failures (connection refused, timeout, DNS)
client.interceptors.error.use((error) => {
  console.error('[API_CLIENT] ERROR:', error); // DEBUG
  return error;
});
