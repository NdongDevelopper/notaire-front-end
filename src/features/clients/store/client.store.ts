import { create } from 'zustand';

import { clientService } from '../services/client.service';
import type { Client, CreateClientInput } from '../types/client.types';

interface ClientState {
  clients: Client[];
  total: number;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  isModalOpen: boolean;

  setSearchQuery: (query: string) => void;
  openModal: () => void;
  closeModal: () => void;

  fetchClients: () => Promise<void>;
  createClient: (input: CreateClientInput) => Promise<Client>;
  removeClient: (id: string) => Promise<void>;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  total: 0,
  isLoading: false,
  error: null,
  searchQuery: '',
  isModalOpen: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  fetchClients: async () => {
    set({ isLoading: true, error: null });
    try {
      const { searchQuery } = get();
      const { items, total } = await clientService.list({ search: searchQuery || undefined });
      set({ clients: items, total, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: 'Impossible de charger la liste des clients. Veuillez réessayer.',
      });
      throw err;
    }
  },

  createClient: async (input) => {
    const client = await clientService.create(input);
    // Optimistic prepend so the new fiche appears immediately in the table.
    set((state) => ({ clients: [client, ...state.clients], total: state.total + 1 }));
    return client;
  },

  removeClient: async (id) => {
    const previous = get().clients;
    set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
    try {
      await clientService.remove(id);
    } catch (err) {
      // Roll back on failure.
      set({ clients: previous });
      throw err;
    }
  },
}));
