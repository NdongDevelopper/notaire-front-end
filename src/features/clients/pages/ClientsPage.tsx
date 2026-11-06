import { Button } from '../../../shared/components/ui/Button/Button';

import { ClientSearchInput } from '../components/ClientSearchInput';
import { ClientsTable } from '../components/ClientsTable';
import { NewClientModal } from '../components/NewClientModal';
import { useClients } from '../hooks/useClients';
import { useClientStore } from '../store/client.store';

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-4 w-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

export function ClientsPage() {
  const { clients, isLoading, searchQuery, setSearchQuery } = useClients();
  const openModal = useClientStore((s) => s.openModal);
  const removeClient = useClientStore((s) => s.removeClient);

  return (
    <div className="py-6 px-6">
      <div className="flex items-start justify-between pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gérez votre base de données clients et sociétés.
          </p>
        </div>
        <Button onClick={openModal} icon={<PlusIcon />}>
          Nouveau Client
        </Button>
      </div>

      <ClientSearchInput value={searchQuery} onChange={setSearchQuery} />

      <ClientsTable clients={clients} isLoading={isLoading} onDelete={(c) => removeClient(c.id)} />

      <NewClientModal />
    </div>
  );
}
