import React, { useState } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
import { UserFormModal } from './UserFormModal';
import { UserActionsDropdown } from './UserActionsDropdown';
import { UsersTableSkeleton } from './UsersTableSkeleton';
import { ConfirmationModal } from '../../../../shared/components/ui/Modal/ConfirmationModal';
import { type User } from '../../types/settings';
import { useUsers } from '../../hooks/useUsers';
import { useDeactivateUser } from '../../hooks/useDeactivateUser';
import { useActivateUser } from '../../hooks/useActivateUser';
import { useResetPassword } from '../../hooks/useResetPassword';
import { useDeleteUser } from '../../hooks/useDeleteUser';
import { useToast } from '../../../../shared/components/ui/Toast/Toast';

type ActionType = 'ACTIVER' | 'DESACTIVER' | 'SUPPRIMER' | 'RESET_PASSWORD';

export const UsersTable: React.FC = () => {
  const [page, setPage] = useState<number>(1);

  const { data, isLoading, error } = useUsers(page);
  const { mutate: deactivateUser } = useDeactivateUser();
  const { mutate: activateUser } = useActivateUser();
  const { mutate: resetPassword } = useResetPassword();
  const { mutate: deleteUser } = useDeleteUser(page);
  const toast = useToast();

  const users = data?.results || [];
  const hasNext = data?.next !== null;
  const hasPrevious = data?.previous !== null;
  const totalCount = data?.count || 0;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: ActionType; user: User } | null>(null);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setActiveMenuUserId(null);
  };

  const handleConfirmExecute = async () => {
    if (!confirmAction) return;
    const { type, user } = confirmAction;

    if (type === 'DESACTIVER') {
      deactivateUser(user.id);
    } else if (type === 'ACTIVER') {
      activateUser(user.id);
    } else if (type === 'RESET_PASSWORD') {
      toast.info(`Un e-mail de réinitialisation a été envoyé à ${user.email}.`);
      resetPassword(user.id);
    } else if (type === 'SUPPRIMER') {
      deleteUser(user.id);
    }

    setConfirmAction(null);
  };

  if (isLoading) {
    return <UsersTableSkeleton />;
  }

  if (error) {
    return <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">Une erreur est survenue lors de la récupération des utilisateurs. Vérifiez votre connexion au serveur.</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm w-full">
      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-lg font-bold text-text">Gestion des comptes</h2>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto bg-activeBtn text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          Ajouter un utilisateur
        </button>
      </div>

      <div className="w-full overflow-x-auto md:overflow-visible">
        {users.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm">Aucun utilisateur trouvé sur cette page.</div>
        ) : (
          <table className="w-full min-w-187.5 text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Utilisateur</th>
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Rôle</th>
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Téléphone</th>
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Statut</th>
                <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 md:overflow-visible">
              {users.map((user) => {
                const isProtected = user.role === 'associe';
                const initial = user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U';

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-activeBtn font-bold flex items-center justify-center shrink-0">{initial}</div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-text">{user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</span>
                          <span className="text-xs text-text-muted">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="text-sm font-semibold text-text capitalize">{user.role?.replace('_', ' ')}</span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="text-sm text-text-muted">{user.telephone || '—'}</span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {user.is_active ? 'ACTIF' : 'INACTIF'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap relative">
                      <div className="flex items-center justify-end gap-3">
                        {!isProtected &&
                          (user.is_active ? (
                            <button onClick={() => setConfirmAction({ type: 'DESACTIVER', user })} className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer">
                              Désactiver
                            </button>
                          ) : (
                            <button onClick={() => setConfirmAction({ type: 'ACTIVER', user })} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer">
                              Activer
                            </button>
                          ))}

                        <button
                          onClick={() => setActiveMenuUserId(activeMenuUserId === user.id ? null : user.id)}
                          className={`text-slate-400 hover:text-text transition-colors p-1 rounded-md hover:bg-slate-100 cursor-pointer ${activeMenuUserId === user.id ? 'bg-slate-100 text-text' : ''}`}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuUserId === user.id && (
                          <UserActionsDropdown
                            isProtected={user.role === 'associe'}
                            onClose={() => setActiveMenuUserId(null)}
                            onEdit={() => handleEditUser(user)}
                            onResetPassword={() => setConfirmAction({ type: 'RESET_PASSWORD', user })}
                            onDelete={() => setConfirmAction({ type: 'SUPPRIMER', user })}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Barre basse de Pagination UI */}
      {totalCount > 0 && (
        <div className="p-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <span className="text-sm text-text-muted">
            Total : <span className="font-semibold text-text">{totalCount}</span> collaborateur(s)
          </span>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setPage((old) => Math.max(old - 1, 1))}
              disabled={!hasPrevious}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Précédent
            </button>
            <span className="text-sm text-text font-medium px-2">
              Page <span className="font-bold">{page}</span>
            </span>
            <button
              onClick={() => setPage((old) => (hasNext ? old + 1 : old))}
              disabled={!hasNext}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      <UserFormModal
        isOpen={editingUser !== null || isAddModalOpen}
        onClose={() => {
          setEditingUser(null);
          setIsAddModalOpen(false);
        }}
        userToEdit={editingUser}
      />
      <ConfirmationModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmExecute}
        title={
          confirmAction?.type === 'SUPPRIMER'
            ? 'Supprimer définitivement le compte'
            : confirmAction?.type === 'DESACTIVER'
              ? 'Désactiver l’accès du compte'
              : confirmAction?.type === 'ACTIVER'
                ? 'Activer l’accès du compte'
                : 'Réinitialiser le mot de passe'
        }
        description={
          confirmAction?.type === 'SUPPRIMER'
            ? `Attention, cette action est irréversible. Êtes-vous sûr de vouloir supprimer définitivement le compte de ${confirmAction?.user.first_name} ${confirmAction?.user.last_name} ?`
            : confirmAction?.type === 'DESACTIVER'
              ? `Le collaborateur ${confirmAction?.user.first_name} ${confirmAction?.user.last_name} ne pourra plus se connecter à l'application.`
              : confirmAction?.type === 'ACTIVER'
                ? `Le collaborateur ${confirmAction?.user.first_name} ${confirmAction?.user.last_name} retrouvera immédiatement un accès complet à l'application.`
                : `Un e-mail contenant un lien de réinitialisation sera envoyé à l'adresse ${confirmAction?.user.email}.`
        }
        variant={confirmAction?.type === 'SUPPRIMER' ? 'danger' : confirmAction?.type === 'DESACTIVER' ? 'warning' : 'info'}
        confirmLabel={confirmAction?.type === 'SUPPRIMER' ? 'Supprimer' : confirmAction?.type === 'DESACTIVER' ? 'Désactiver' : confirmAction?.type === 'ACTIVER' ? 'Activer le compte' : 'Envoyer'}
      />
    </div>
  );
};
