import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { useToast } from '@/shared/components/ui/Toast/Toast';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { api } from '@/shared/services/api';
import { getErrorMessage } from '@/shared/utils/errors';
import { toArray } from '@/shared/utils/http';
import type { TypeActe, User, Client } from '../types/case';

interface CreateCasePageProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSubmit?: (newCase: { title: string; type: string; responsible: string }) => void;
}

const loadCaseOptions = async () => {
  const [typesResponse, usersResponse, clientsResponse] = await Promise.all([
    api.get('/types-actes/options/').catch(() => api.get('/types-actes/?page_size=1000')),
    api.get('/users/options/').catch(() => api.get('/users/?page_size=1000')),
    api.get('/clients/options/').catch(() => api.get('/clients/?page_size=1000')),
  ]);

  return {
    typesActesList: toArray<TypeActe>(typesResponse.data),
    usersList: toArray<User>(usersResponse.data),
    clientsList: toArray<Client>(clientsResponse.data),
  };
};

/**
//  * Les endpoints /api/*/
//  * clients/views.py) renvoient un champ "label" unique et déjà formaté,
//  * différent des champs "nom" (Client) ou "first_name/last_name/username"
//  * (User) que renvoie la liste paginée complète utilisée en repli. Ces deux
//  * fonctions gèrent les deux formes de réponse sans distinguer laquelle a
//  * répondu, pour ne jamais afficher un champ vide ou un identifiant brut.
//  */
function getClientLabel(client: Client & { label?: string }): string {
  return client.label || client.nom || 'Client sans nom';
}

function getUserLabel(user: User & { label?: string }): string {
  if (user.label) return user.label;
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  if (firstName || lastName) return `${firstName} ${lastName}`.trim();
  if (user.username) return user.username;
  if (user.email) return user.email;
  return user.id || 'Utilisateur sans nom';
}

export const CreateCasePage = ({ isOpen, onClose, onSuccess, onSubmit }: CreateCasePageProps) => {
  const toast = useToast();
  const [objet, setObjet] = useState('');
  const [typeActe, setTypeActe] = useState<number | ''>('');
  const [responsableId, setResponsableId] = useState('');
  const [clientId, setClientId] = useState('');
  const [montant, setMontant] = useState<number | ''>('');
  const [dateCible, setDateCible] = useState('');
  const [priorite, setPriorite] = useState<'basse' | 'normale' | 'haute'>('normale');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { role, loading: permissionsLoading, can } = usePermissions();
  // Filet de sécurité : si la matrice de permissions (RolePermission, encore
  // vide en base à ce stade) n'autorise personne, on retombe sur le droit
  // calculé côté serveur par GET /api/auth/me/ (MeView.permissions), qui lui
  // reflète correctement le rôle (ex: un juriste peut créer un dossier).
  const permissionsServeur = useAuthStore((state) => state.user?.permissions);
  const canCreate = can('creer', 'dossier') || Boolean(permissionsServeur?.peut_creer_dossier);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['case-create-options'],
    queryFn: loadCaseOptions,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const typesActesList = data?.typesActesList ?? [];
  const usersList = data?.usersList ?? [];
  const clientsList = data?.clientsList ?? [];
  const internalUsers = useMemo(
    () => usersList.filter((user) => user.role?.toLowerCase() !== 'client'),
    [usersList]
  );

  const syncDefaults = (nextData: { typesActesList: TypeActe[]; usersList: User[]; clientsList: Client[] }) => {
    if (typeActe === '' && nextData.typesActesList.length > 0) {
      setTypeActe(nextData.typesActesList[0].id);
    }
    if (!responsableId && internalUsers.length > 0) {
      setResponsableId(internalUsers[0].id);
    }
    if (!clientId && nextData.clientsList.length > 0) {
      setClientId(nextData.clientsList[0].id);
    }
  };

  if (data && (typeActe === '' || !responsableId || !clientId)) {
    syncDefaults(data);
  }

  const handleFormSubmit = async () => {
    if (!canCreate) {
      toast.error('Vous n’avez pas les permissions nécessaires pour créer un dossier.');
      return;
    }

    if (!objet.trim() || !typeActe || !clientId || !responsableId) {
      toast.warning('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setSubmitting(true);

    const payload = {
      type_acte: Number(typeActe),
      objet: objet.trim(),
      statut: 'ouvert',
      priorite,
      client: clientId,
      responsable: responsableId,
      montant: Number(montant || 0),
      date_cible: dateCible || new Date().toISOString().split('T')[0],
      description: description || '',
      notes: '',
    };

    try {
      await api.post('/dossiers/', payload);

      if (typeof onSubmit === 'function') {
        onSubmit({
          title: objet.trim(),
          type: typesActesList.find((item) => item.id === Number(typeActe))?.libelle || String(typeActe),
          responsible: usersList.find((user) => user.id === responsableId)
            ? getUserLabel(usersList.find((user) => user.id === responsableId)!)
            : responsableId,
        });
      }

      if (typeof onSuccess === 'function') {
        onSuccess();
      }

      toast.success('Dossier créé avec succès.');
      setObjet('');
      setDescription('');
      setMontant('');
      setDateCible('');
      setPriorite('normale');
      setTypeActe(typesActesList[0]?.id ?? '');
      setClientId(clientsList[0]?.id ?? '');
      setResponsableId(internalUsers[0]?.id ?? '');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const disableSubmit = submitting || isLoading || permissionsLoading || !canCreate || isError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer un nouveau dossier"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="hover:!bg-slate-200" disabled={submitting}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleFormSubmit}
            className="hover:!bg-blue-700"
            disabled={disableSubmit}
            title={isError ? 'Impossible de charger les référentiels.' : !canCreate ? 'Droits insuffisants pour créer un dossier.' : undefined}
          >
            {submitting ? 'Création...' : 'Créer le dossier'}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="py-10 text-center text-sm font-medium text-slate-500">Chargement…</div>
      ) : (
        <div className="space-y-4">
          {!canCreate && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <span className="font-medium">Accès restreint :</span> Vous n’avez pas les permissions nécessaires pour créer un dossier.
                <br />
                <span className="text-xs">Rôle actuel : <strong>{role || 'inconnu'}</strong></span>
              </div>
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              Impossible de charger les types d'actes, clients et responsables.
              <button type="button" onClick={() => void refetch()} className="ml-2 underline underline-offset-2">
                Réessayer
              </button>
            </div>
          )}

          <Input
            label="Objet / Titre du dossier *"
            type="text"
            required
            value={objet}
            className="border border-slate-200"
            onChange={(event) => setObjet(event.target.value)}
            placeholder="Ex: Vente terrain"
            disabled={!canCreate || isLoading || isError}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Type d'acte *
              </label>
              <select
                value={typeActe}
                onChange={(event) => setTypeActe(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none"
                disabled={!canCreate || isLoading || isError || typesActesList.length === 0}
              >
                {typesActesList.length === 0 ? (
                  <option value="">Aucun type d'acte disponible.</option>
                ) : (
                  <>
                    <option value="">Sélectionner…</option>
                    {typesActesList.map((item) => (
                      <option key={item.id} value={item.id}>{item.libelle}</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Client associé *
              </label>
              <select
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none"
                disabled={!canCreate || isLoading || isError || clientsList.length === 0}
              >
                {clientsList.length === 0 ? (
                  <option value="">Aucun client disponible.</option>
                ) : (
                  <>
                    <option value="">Sélectionner…</option>
                    {clientsList.map((client) => (
                      <option key={client.id} value={client.id}>{getClientLabel(client)}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Responsable *
            </label>
            <select
              value={responsableId}
              onChange={(event) => setResponsableId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none"
              disabled={!canCreate || isLoading || isError || internalUsers.length === 0}
            >
              {internalUsers.length === 0 ? (
                <option value="">Aucun responsable disponible.</option>
              ) : (
                <>
                  <option value="">Sélectionner…</option>
                  {internalUsers.map((user) => (
                    <option key={user.id} value={user.id}>{getUserLabel(user)}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Date cible"
              type="date"
              value={dateCible}
              onChange={(event) => setDateCible(event.target.value)}
              disabled={!canCreate || isLoading || isError}
            />
            <Input
              label="Montant (FCFA)"
              type="number"
              value={montant}
              className="border border-slate-200"
              onChange={(event) => setMontant(event.target.value === '' ? '' : Number(event.target.value))}
              disabled={!canCreate || isLoading || isError}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Priorité
            </label>
            <select
              value={priorite}
              onChange={(event) => setPriorite(event.target.value as 'basse' | 'normale' | 'haute')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none"
              disabled={!canCreate || isLoading || isError}
            >
              <option value="basse">Basse</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-20 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none"
              disabled={!canCreate || isLoading || isError}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};