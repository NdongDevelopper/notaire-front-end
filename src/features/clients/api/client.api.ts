// ADJUST THIS IMPORT to wherever the configured axios instance from the
// auth module lives (the one with the request/response interceptors).
import { api } from '@/shared/services/api';

import type {
  ClientDto,
  ClientListQueryDto,
  ClientListResponseDto,
  CreateClientDto,
} from './client.dto';

const BASE_URL = '/clients';

export const clientApi = {
  list: (params?: ClientListQueryDto) =>
    api.get<ClientListResponseDto>(`${BASE_URL}/`, { params }),

  getById: (id: string) => api.get<ClientDto>(`${BASE_URL}/${id}/`),

  create: (payload: CreateClientDto) => api.post<ClientDto>(`${BASE_URL}/`, payload),

  update: (id: string, payload: Partial<CreateClientDto>) =>
    api.patch<ClientDto>(`${BASE_URL}/${id}/`, payload),

  remove: (id: string) => api.delete<void>(`${BASE_URL}/${id}/`),
};
