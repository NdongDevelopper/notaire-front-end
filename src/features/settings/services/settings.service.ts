import { api } from '../../../shared/services/api';
import type { AddUserInput } from '../types/addUser.schema';
import type { ChecklistPiece, CreateChecklistPiecePayload, CreateEtapePayload, CreateTypeActePayload, EtapeWorkflow, Etude, EtudePayload, PaginatedUsers, Permission, PermissionChoix, PermissionMatrice, TypeActeResponse, User } from '../types/settings';

export const usersService = {
  createUser: async (userData: AddUserInput): Promise<void> => {
    await api.post('/users/', userData);
  },

  getUsers: async (page: number = 1): Promise<PaginatedUsers> => {
    const response = await api.get<PaginatedUsers>(`/users/?page=${page}`);
    console.log('Flux pagination Backend :', response.data);
    return response.data;
  },

  deactivateUser: async (userId: string): Promise<void> => {
    await api.post(`/users/${userId}/deactivate/`);
  },

  activateUser: async (id: string): Promise<void> => {
    await api.post(`/users/${id}/activate/`);
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}/`, data);
    return response.data;
  },

  resetUserPassword: async (userId: string) => {
    const response = await api.post(`/users/${userId}/reset-password/`);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}/`);
  },

  createTypeActe: async (payload: CreateTypeActePayload): Promise<TypeActeResponse> => {
    const { data } = await api.post<TypeActeResponse>('/types-actes/', payload);
    return data;
  },

  getAll: async (): Promise<TypeActeResponse[]> => {
    const { data } = await api.get<{ results: TypeActeResponse[] }>('/types-actes/');
    return data.results;
  },

  updateTypeActe: async (id: string, libelle: string): Promise<TypeActeResponse> => {
    const response = await api.patch<TypeActeResponse>(`/types-actes/${id}/`, { libelle });
    return response.data;
  },

  deleteTypeActe: async (id: string): Promise<void> => {
    await api.delete(`/types-actes/${id}/`);
  },
};

export const permissionsService = {
  /** Matrice groupée { role: { module: { action: bool } } } pour l'affichage. */
  getMatrice: async (): Promise<PermissionMatrice> => {
    const { data } = await api.get<PermissionMatrice>('/permissions/matrice/');
    return data;
  },

  getChoix: async (): Promise<PermissionChoix> => {
    const { data } = await api.get<PermissionChoix>('/permissions/choix/');
    console.log(data);
    return data;
  },

  getPermissions: async (filters?: { role?: string; module?: string }): Promise<Permission[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.set('role', filters.role);
    if (filters?.module) params.set('module', filters.module);
    const query = params.toString();
    const { data } = await api.get<Permission[] | { results: Permission[] }>(`/permissions/${query ? `?${query}` : ''}`);
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  /** Coche / décoche une permission précise. */
  updatePermission: async (id: string, allowed: boolean): Promise<Permission> => {
    const { data } = await api.patch<Permission>(`/permissions/${id}/`, { allowed });
    return data;
  },
};

export const etapesWorkflowService = {
  create: async (payload: CreateEtapePayload): Promise<EtapeWorkflow> => {
    const { data } = await api.post<EtapeWorkflow>('/etapes-workflow/', payload);
    return data;
  },

  update: async (id: number, payload: Partial<CreateEtapePayload>): Promise<EtapeWorkflow> => {
    const { data } = await api.patch<EtapeWorkflow>(`/etapes-workflow/${id}/`, payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/etapes-workflow/${id}/`);
  },
};

export const etudeService = {
  /** Récupère l'étude (singleton) : première entrée, ou null si aucune. */
  get: async (): Promise<Etude | null> => {
    const { data } = await api.get<Etude[] | { results: Etude[] }>('/etude/');
    const list = Array.isArray(data) ? data : (data.results ?? []);
    return list[0] ?? null;
  },

  create: async (payload: EtudePayload): Promise<Etude> => {
    const { data } = await api.post<Etude>('/etude/', payload);
    return data;
  },

  update: async (id: number, payload: Partial<EtudePayload>): Promise<Etude> => {
    const { data } = await api.patch<Etude>(`/etude/${id}/`, payload);
    return data;
  },
};

export const checklistPiecesService = {
  create: async (payload: CreateChecklistPiecePayload): Promise<ChecklistPiece> => {
    const { data } = await api.post<ChecklistPiece>('/checklist-pieces/', payload);
    return data;
  },

  update: async (id: number, payload: Partial<CreateChecklistPiecePayload>): Promise<ChecklistPiece> => {
    const { data } = await api.patch<ChecklistPiece>(`/checklist-pieces/${id}/`, payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/checklist-pieces/${id}/`);
  },
};
