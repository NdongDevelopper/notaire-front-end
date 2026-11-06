import { useEffect } from 'react';

import { useClientStore } from '../store/client.store';

const SEARCH_DEBOUNCE_MS = 300;

export function useClients() {
  const clients = useClientStore((s) => s.clients);
  const total = useClientStore((s) => s.total);
  const isLoading = useClientStore((s) => s.isLoading);
  const error = useClientStore((s) => s.error);
  const searchQuery = useClientStore((s) => s.searchQuery);
  const setSearchQuery = useClientStore((s) => s.setSearchQuery);
  const fetchClients = useClientStore((s) => s.fetchClients);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchClients();
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  return {
    clients,
    total,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    refetch: fetchClients,
  };
}
