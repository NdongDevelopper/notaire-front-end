import { useEffect, useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal/Modal';
import Button from '../../../shared/components/ui/Button/Button';
import { clientService } from '../../clients/services/client.service';
import type { Client } from '../../clients/types/client.types';

interface ModalLinkClientProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (clientId: string, role: string) => void;
}

// Codes attendus par le backend (cohérents avec le style snake_case sans accent
// utilisé partout ailleurs dans l'API : pieces_en_cours, en_redaction, etc.)
const ROLE_OPTIONS: { code: string; label: string }[] = [
  { code: 'acquereur', label: 'Acquéreur' },
  { code: 'vendeur', label: 'Vendeur' },
  { code: 'donateur', label: 'Donateur' },
  { code: 'beneficiaire', label: 'Bénéficiaire' },
  { code: 'creancier', label: 'Créancier' },
];

export const ModalLinkClient = ({ isOpen, onClose, onConfirm }: ModalLinkClientProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedRole, setSelectedRole] = useState(ROLE_OPTIONS[0].code);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    const loadClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await clientService.list({ pageSize: 100 });
        if (!isMounted) {
          return;
        }

        setClients(result.items);
        setSelectedClientId(result.items[0]?.id || '');
      } catch (err: any) {
        if (!isMounted) {
          return;
        }

        setError(err?.response?.data?.detail || 'Impossible de charger les clients.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadClients();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleConfirm = () => {
    if (!selectedClientId) {
      return;
    }

    onConfirm(selectedClientId, selectedRole);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lier un client"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="hover:!bg-slate-200">
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            className="hover:!bg-blue-700"
            disabled={!selectedClientId || loading || clients.length === 0}
          >
            Lier
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Sélectionner Client
          </label>
          {loading ? (
            <div className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-500">
              Chargement des clients...
            </div>
          ) : clients.length > 0 ? (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm"
            >
              <option value="">Choisir un client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                  {client.telephone ? ` - ${client.telephone}` : ''}
                  {client.email ? `${client.telephone ? '' : ' - '}${client.email}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-500">
              Aucun client disponible. Veuillez créer un client avant de l'associer à un dossier.
            </div>
          )}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Rôle
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.code} value={role.code}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
};