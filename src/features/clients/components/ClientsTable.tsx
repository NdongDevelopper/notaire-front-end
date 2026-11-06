// ADJUST THIS IMPORT to match the shared Loader component's actual location.
import { useState } from 'react';
import { Loader } from '../../../shared/components/ui/Loader/Loader';
import { ConfirmationModal } from '../../../shared/components/ui/Modal/ConfirmationModal';

import type { Client } from '../types/client.types';
import { formatPhoneDisplay, getClientDisplayName } from '../utils/client.utils';
import { ClientTypeBadge } from './ClientTypeBadge';

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
  onDelete?: (client: Client) => void;
}

const columns = ['Nom', 'Contact', 'Adresse', 'Type', 'Actions'];

export function ClientsTable({ clients, isLoading, onDelete }: ClientsTableProps) {
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
  };

  const handleConfirmDelete = () => {
    if (clientToDelete && onDelete) {
      onDelete(clientToDelete);
    }
    setClientToDelete(null);
  };

  const selectedClientName = clientToDelete ? getClientDisplayName(clientToDelete) : 'ce client';

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
      <table className="min-w-[720px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-6 py-3">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading && (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <Loader size="sm" />
                  <span>Chargement des clients...</span>
                </div>
              </td>
            </tr>
          )}

          {!isLoading && clients.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                Aucun client trouvé.
              </td>
            </tr>
          )}

          {!isLoading &&
            clients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50/60">
                <td className="px-6 py-4 font-medium text-slate-900">
                  {getClientDisplayName(client)}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  <div>{formatPhoneDisplay(client.telephone)}</div>
                  <div className="text-xs text-slate-400">{client.email}</div>
                </td>
                <td className="px-6 py-4 text-slate-600">{client.adresse}</td>
                <td className="px-6 py-4">
                  <ClientTypeBadge type={client.type} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(client)}
                        className="text-sm font-medium text-red-500 hover:underline"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <ConfirmationModal
        isOpen={clientToDelete !== null}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le client"
        description={`Cette action est irréversible. Le client "${selectedClientName}" sera supprimé de la base.`}
        variant="danger"
        confirmLabel="Supprimer"
      />
    </div>
  );
}
