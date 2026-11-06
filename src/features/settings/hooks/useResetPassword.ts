import { useMutation } from '@tanstack/react-query';
import { usersService } from '../services/settings.service';
import { useToast } from '../../../shared/components/ui/Toast/Toast';

export const useResetPassword = () => {
  const toast = useToast();

  return useMutation({
    mutationFn: usersService.resetUserPassword,
    onError: () => {
      toast.error("L'envoi de l'e-mail a échoué. Veuillez réessayer.");
    },
  });
};
