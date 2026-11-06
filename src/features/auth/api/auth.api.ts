import { api } from '../../../shared/services/api';
import type {
  LoginCredentials,
  LoginResponseDTO,
  MeResponseDTO,
  RefreshResponseDTO,
} from '../types/auth.types';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<LoginResponseDTO>('/auth/login/', credentials),

  logout: () => {
    return api.post('/auth/logout/').catch((error) => {
      console.error('Logout API call failed:', error);
      // Don't throw - logout should always succeed locally
    });
  },

  me: () => api.get<MeResponseDTO>('/auth/me/'),

  refresh: () => api.post<RefreshResponseDTO>('/auth/refresh/'),

  changePassword: (old_password: string, new_password: string) =>
    api.post('/auth/change-password/', { old_password, new_password }),
};
