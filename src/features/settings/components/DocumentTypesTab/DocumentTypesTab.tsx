import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DocumentTypeCard } from './DocumentTypeCard';
import { TypeActeFormModal } from './TypeActeFormModal';
import { WorkflowConfigModal } from './WorkflowConfigModal';
import { DocumentTypesSkeleton } from './DocumentTypesSkeleton';
import { useTypesActes } from '../../hooks/useTypesActes';
import { useDeleteTypeActe } from '../../hooks/useDeleteTypeActe'; // 1. Import du hook de suppression
import { Modal } from '../../../../shared/components/ui/Modal/Modal';
import { TypeActeResponse } from '../../types/settings';

interface TypeActeItem {
  id: string;
  title: string;
  steps: number;
  documents: number;
}

export const DocumentTypesTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // États pour stocker l'élément sélectionné lors des actions du menu 3 points
  const [typeActeToEdit, setTypeActeToEdit] = useState<TypeActeResponse | null>(null);
  const [typeActeToDelete, setTypeActeToDelete] = useState<TypeActeItem | null>(null);
  const [typeActeToConfigure, setTypeActeToConfigure] = useState<TypeActeItem | null>(null);

  // Récupération des données
  const { data: typesActes, isLoading, isError } = useTypesActes();

  // 2. Initialisation de la mutation de suppression
  const { mutateAsync: deleteTypeActe, isPending: isDeleting } = useDeleteTypeActe();

  if (isLoading) {
    return <DocumentTypesSkeleton />;
  }

  if (isError) {
    return (
      <div className="w-full p-5 border border-red-100 bg-red-50 text-red-600 rounded-xl text-center text-sm font-semibold shadow-sm">Impossible de charger les types d'actes. Veuillez vérifier votre connexion ou l'état du serveur.</div>
    );
  }

  // Fonction pour fermer la modal de formulaire (Création ou Édition)
  const handleCloseFormModal = () => {
    setIsModalOpen(false);
    setTypeActeToEdit(null);
  };

  // 3. Action de suppression réelle connectée au backend Django
  const handleConfirmDelete = async () => {
    if (!typeActeToDelete) return;

    try {
      await deleteTypeActe(typeActeToDelete.id); // Appel de l'API DELETE /api/types-actes/<id>/
      setTypeActeToDelete(null); // Ferme la modal après succès
      console.log('Suppression effectuée avec succès !');
    } catch (error) {
      console.error('Échec de la suppression :', error);
    }
  };

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Liste des cartes dynamiques */}
      {typesActes?.map((type) => {
        const cardData = {
          id: type.id,
          title: type.libelle,
          steps: type.etapes?.length ?? 0,
          documents: type.checklist?.length ?? 0,
        };

        return (
          <DocumentTypeCard
            key={type.id}
            type={cardData}
            onEdit={() => setTypeActeToEdit(type)} // Ouvre le formulaire en mode édition
            onDelete={(selected) => setTypeActeToDelete(selected)} // Ouvre la modal de confirmation de suppression
            onConfigure={(selected) => setTypeActeToConfigure(selected)} // Ouvre la config du workflow
          />
        );
      })}

      {/* Bouton pour ouvrir la modal de création */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-text-muted hover:border-activeBtn hover:text-activeBtn transition-colors min-h-[200px] cursor-pointer"
      >
        <Plus size={32} className="mb-2" />
        <span className="font-semibold">Nouveau type d'acte</span>
      </button>

      {/* Modal unique pour le Formulaire (Création ou Édition) */}
      <TypeActeFormModal isOpen={isModalOpen || !!typeActeToEdit} onClose={handleCloseFormModal} typeActe={typeActeToEdit} />

      {/* Modal de configuration du workflow (étapes + checklist) */}
      <WorkflowConfigModal isOpen={!!typeActeToConfigure} onClose={() => setTypeActeToConfigure(null)} typeActe={typeActeToConfigure} />

      {/* Modal de confirmation de Suppression */}
      <Modal
        isOpen={!!typeActeToDelete}
        onClose={() => !isDeleting && setTypeActeToDelete(null)}
        title="Supprimer le type d'acte"
        size="sm"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setTypeActeToDelete(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-text-muted">
          Êtes-vous sûr de vouloir supprimer le type d'acte <span className="font-semibold text-text">"{typeActeToDelete?.title}"</span> ? Cette action est irréversible et supprimera toutes les configurations associées.
        </p>
      </Modal>
    </div>
  );
};
