import React from 'react';
import { Modal } from '../../../../shared/components/ui/Modal/Modal';
import { AddUserForm } from './AddUserForm';
import type { AddUserInput } from '../../types/addUser.schema';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded?: (user: AddUserInput) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded }) => {
  const handleSubmitSuccess = async (data: AddUserInput) => {
    // C'est ici que tu mettras ton dispatch Redux ou ton appel API (Axios/Fetch)
    console.log('Données prêtes pour le backend :', data);

    if (onUserAdded) {
      onUserAdded(data);
    }

    // Fermeture automatique du modal après succès
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un nouvel utilisateur">
      <AddUserForm onSubmitSuccess={handleSubmitSuccess} onCancel={onClose} />
    </Modal>
  );
};
