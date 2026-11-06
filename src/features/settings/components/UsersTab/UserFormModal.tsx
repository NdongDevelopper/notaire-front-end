import React from 'react';
import { Modal } from '../../../../shared/components/ui/Modal/Modal';
import { AddUserForm } from './AddUserForm';
import { type User } from '../../types/settings';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, userToEdit }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={userToEdit ? "Modifier l'utilisateur" : 'Ajouter un nouvel utilisateur'} size="lg">
      <AddUserForm initialData={userToEdit || undefined} onSubmitSuccess={onClose} onCancel={onClose} />
    </Modal>
  );
};
