import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/Modal/Modal';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import { useToast } from '../../../shared/components/ui/Toast/Toast';

const schema = z
  .object({
    old_password: z.string().min(1, 'Veuillez saisir votre mot de passe temporaire'),
    new_password: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
    confirm_password: z.string().min(1, 'Veuillez confirmer le nouveau mot de passe'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

function PasswordField({
  label,
  placeholder,
  error,
  registration,
}: {
  label: string;
  placeholder: string;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm<FormData>>['register']>;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          {...registration}
          className={`w-full rounded-lg border p-3 pr-20 text-sm text-slate-800 outline-none transition-all focus:ring-2 focus:ring-activeBtn ${
            error ? 'border-red-400 focus:ring-red-200' : 'border-slate-200'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          {show ? 'Masquer' : 'Afficher'}
        </button>
      </div>
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
    </div>
  );
}

export function ForceChangePasswordModal() {
  const clearForceChangePassword = useAuthStore((state) => state.clearForceChangePassword);
  const toast = useToast();
  const [showWarning, setShowWarning] = useState(false);

  const handleClose = () => {
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 3000);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      // Le changement de mot de passe est une opération serveur :
      // lorsqu'elle réussit, on met également à jour le profil offline
      // afin que le prochain rechargement hors ligne ne réaffiche pas
      // cette modale.
      await authService.changePassword(data.old_password, data.new_password);
      clearForceChangePassword();
      toast.success('Mot de passe mis à jour avec succès.');
    } catch {
      toast.error('Mot de passe temporaire incorrect ou une erreur est survenue.');
    }
  };

  return (
    <Modal isOpen={true} onClose={handleClose} title="Changement de mot de passe requis">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
            <KeyRound size={20} className="text-amber-500" />
          </div>
          <p className="text-sm text-slate-500">
            Saisissez le mot de passe temporaire reçu par e-mail, puis choisissez un nouveau mot de passe.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <PasswordField
            label="Mot de passe temporaire"
            placeholder="Reçu par e-mail"
            error={errors.old_password?.message}
            registration={register('old_password')}
          />
          <PasswordField
            label="Nouveau mot de passe"
            placeholder="Minimum 8 caractères"
            error={errors.new_password?.message}
            registration={register('new_password')}
          />
          <PasswordField
            label="Confirmer le nouveau mot de passe"
            placeholder="Répéter le mot de passe"
            error={errors.confirm_password?.message}
            registration={register('confirm_password')}
          />

          {showWarning && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 text-center">
              Vous devez changer votre mot de passe avant de continuer.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-activeBtn py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
          </button>
        </form>
      </div>
    </Modal>
  );
}
