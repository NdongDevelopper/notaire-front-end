// ADJUST THIS IMPORT to match the shared Modal component's actual location.
import { Modal } from '../../../shared/components/ui/Modal/Modal';

import { useCreateClient } from '../hooks/useCreateClient';
import { useClientStore } from '../store/client.store';
import { ClientForm } from './ClientForm';

export function NewClientModal() {
  const isModalOpen = useClientStore((s) => s.isModalOpen);
  const closeModal = useClientStore((s) => s.closeModal);
  const { submit, isSubmitting } = useCreateClient();

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} title="Nouvelle Fiche Client" size="md">
      <ClientForm onSubmit={submit} onCancel={closeModal} isSubmitting={isSubmitting} />
    </Modal>
  );
}
