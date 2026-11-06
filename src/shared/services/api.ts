// src/shared/services/api.ts
import axios from 'axios';
import { setupRequestInterceptor } from './request.interceptor';
import { setupResponseInterceptor } from './response.interceptor';
import { setupOfflineInterceptor } from './offline.interceptor';

function normalizeApiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '/api';
export const API_BASE_URL = normalizeApiBaseUrl(configuredBaseUrl);

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // required: refresh token lives in an httpOnly cookie
  timeout: 60000,
});

setupRequestInterceptor(api);
setupResponseInterceptor(api);
setupOfflineInterceptor(api);
