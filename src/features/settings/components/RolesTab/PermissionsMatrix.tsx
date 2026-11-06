import React, { useMemo, useState } from 'react';
import { usePermissionsMatrice } from '../../hooks/usePermissionsMatrice';
import { usePermissions } from '../../hooks/usePermissions';
import { useUpdatePermission } from '../../hooks/useUpdatePermission';
import { useToast } from '../../../../shared/components/ui/Toast/Toast';
import { useAuthStore } from '../../../auth/store/auth.store';
import { PermissionsMatrixSkeleton } from './PermissionsMatrixSkeleton';

interface Props {
  role: string;
}

const EDITOR_ROLES = ['associe', 'notaire', 'administrateur'];

/** Convertit un libellé ("Associé") en clé backend ("associe"). */
const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Libellés d'affichage pour les clés backend (fallback : capitalisation). */
const MODULE_LABELS: Record<string, string> = {
  clients: 'Clients',
  dossiers: 'Dossiers',
  pieces: 'Pièces',
  taches: 'Tâches',
  finances: 'Finances',
  modeles: 'Modèles',
  actes: 'Actes',
  formalites: 'Formalités',
  rapports: 'Rapports',
  utilisateurs: 'Utilisateurs',
  audit: 'Audit',
  workflow: 'Workflow',
  parametres: 'Paramètres',
};

const ACTION_LABELS: Record<string, string> = {
  voir: 'Voir',
  creer: 'Créer',
  modifier: 'Modifier',
  supprimer: 'Supprimer',
  exporter: 'Exporter',
  valider: 'Valider',
  affecter: 'Affecter',
  archiver: 'Archiver',
};

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);
const moduleLabel = (key: string): string => MODULE_LABELS[key] ?? capitalize(key);
const actionLabel = (key: string): string => ACTION_LABELS[key] ?? capitalize(key);

const cellKey = (module: string, action: string): string => `${module}|${action}`;

export const PermissionsMatrix: React.FC<Props> = ({ role }) => {
  const roleKey = slugify(role);

  const { data: matrice, isLoading: matriceLoading, isError: matriceError } = usePermissionsMatrice();
  const { data: permissions } = usePermissions({ role: roleKey });
  const updatePermission = useUpdatePermission();
  const toast = useToast();

  const currentUserRole = useAuthStore((state) => state.user?.role);
  const canEdit = currentUserRole ? EDITOR_ROLES.includes(currentUserRole) : false;

  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const [prevRoleKey, setPrevRoleKey] = useState(roleKey);
  if (roleKey !== prevRoleKey) {
    setPrevRoleKey(roleKey);
    setDraft({});
  }

  const roleMatrix = matrice?.[roleKey] ?? {};

  const modules = Object.keys(roleMatrix);
  const actions = Object.keys(Object.values(roleMatrix)[0] ?? {});

  const idByCell = useMemo(() => {
    const map: Record<string, string> = {};
    (permissions ?? []).forEach((p) => {
      map[cellKey(p.module, p.action)] = p.id;
    });
    return map;
  }, [permissions]);

  const originalValue = (module: string, action: string): boolean => roleMatrix[module]?.[action] ?? false;

  const currentValue = (module: string, action: string): boolean => {
    const key = cellKey(module, action);
    return key in draft ? draft[key] : originalValue(module, action);
  };

  const toggle = (module: string, action: string): void => {
    if (!canEdit) return;
    const key = cellKey(module, action);
    const next = !currentValue(module, action);
    setDraft((prev) => {
      const copy = { ...prev };
      // Si on revient à la valeur d'origine, ce n'est plus une modification.
      if (next === originalValue(module, action)) {
        delete copy[key];
      } else {
        copy[key] = next;
      }
      return copy;
    });
  };

  const changes = Object.entries(draft);
  const hasChanges = changes.length > 0;

  const handleSave = async (): Promise<void> => {
    if (!canEdit) return;
    setSaving(true);
    const missing: string[] = [];
    try {
      await Promise.all(
        changes.map(([key, allowed]) => {
          const id = idByCell[key];
          if (!id) {
            missing.push(key);
            return Promise.resolve();
          }
          return updatePermission.mutateAsync({ id, allowed });
        })
      );
      setDraft({});
      if (missing.length > 0) {
        toast.error(`Certaines permissions n'ont pas pu être enregistrées (${missing.length}).`);
      } else {
        toast.success('Permissions enregistrées avec succès.');
      }
    } catch (error) {
      console.error('Échec de l’enregistrement des permissions :', error);
      toast.error("L'enregistrement a échoué. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  if (matriceLoading) {
    return <PermissionsMatrixSkeleton />;
  }

  if (matriceError) {
    return (
      <div className="flex-1 bg-white p-6 rounded-xl border border-slate-100 shadow-sm w-full">
        <p className="text-sm text-red-600">Impossible de charger les permissions.</p>
      </div>
    );
  }

  // Rôle absent de la matrice (Associé, Notaire, Admin) = accès complet non configurable.
  const roleConfigurable = Boolean(matrice && roleKey in matrice);
  if (!roleConfigurable) {
    return (
      <div className="flex-1 bg-white p-6 rounded-xl border border-slate-100 shadow-sm w-full">
        <h3 className="text-lg font-bold text-text mb-1">Permissions pour : {role}</h3>
        <p className="text-sm text-text-muted mb-6">Configurez les droits d'accès aux différents modules de la plateforme.</p>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Ce rôle dispose d'un accès complet à tous les modules. Ses permissions ne sont pas configurables.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white p-6 rounded-xl border border-slate-100 shadow-sm w-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-text mb-1">Permissions pour : {role}</h3>
          <p className="text-sm text-text-muted">Configurez les droits d'accès aux différents modules de la plateforme.</p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-activeBtn transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        )}
      </div>

      {!canEdit && <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Lecture seule — seul un associé peut modifier les permissions.</div>}

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-150 text-left">
          <thead>
            <tr className="text-xs font-bold text-text-muted uppercase tracking-wider">
              <th className="py-4">Module</th>
              {actions.map((action) => (
                <th key={action} className="py-4 text-center px-2">
                  {actionLabel(action)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {modules.map((module) => (
              <tr key={module}>
                <td className="py-4 font-semibold text-text whitespace-nowrap">{moduleLabel(module)}</td>
                {actions.map((action) => (
                  <td key={action} className="py-4 text-center px-2">
                    <input type="checkbox" checked={currentValue(module, action)} onChange={() => toggle(module, action)} disabled={saving || !canEdit} className="w-4 h-4 accent-activeBtn cursor-pointer disabled:cursor-not-allowed" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
