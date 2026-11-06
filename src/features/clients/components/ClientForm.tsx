import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// ADJUST THESE IMPORTS to match the shared Button/Input components' actual location.
import { Button } from '../../../shared/components/ui/Button/Button';
import { Input } from '../../../shared/components/ui/Input/Input';

import { clientFormSchema, type ClientFormValues } from '../schemas/client.schema';
import type { ClientType } from '../types/client.types';
import { getNomFieldLabel } from '../utils/client.utils';

interface ClientFormProps {
  onSubmit: (values: ClientFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const defaultValues: ClientFormValues = {
  type: 'physique',
  nom: '',
  telephone: '',
  email: '',
  adresse: '',
  notes: '',
};

export function ClientForm({ onSubmit, onCancel, isSubmitting }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
  });

  const type = watch('type');

  function handleTypeChange(nextType: ClientType) {
    setValue('type', nextType);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Type d'entité
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: 'physique', label: 'Particulier' },
              { value: 'morale', label: 'Société / Entreprise' },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                type === option.value
                  ? 'border-[#3956EC] bg-blue-50 text-[#3956EC]'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                value={option.value}
                checked={type === option.value}
                onChange={() => handleTypeChange(option.value)}
                className="h-4 w-4 accent-[#3956EC]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input
            label={getNomFieldLabel(type)}
            placeholder={type === 'physique' ? 'Ex: Moussa Diop' : 'Ex: SARL Teranga Immobilier'}
            error={errors.nom?.message}
            {...register('nom')}
          />
        </div>

        <Input
          label="Téléphone"
          placeholder="Ex: 77 000 00 00"
          error={errors.telephone?.message}
          {...register('telephone')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="exemple@email.sn"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="col-span-2">
          <Input
            as="textarea"
            label="Adresse complète"
            placeholder="Rue, Quartier, Ville"
            rows={2}
            error={errors.adresse?.message}
            {...register('adresse')}
          />
        </div>

        <div className="col-span-2">
          <Input
            as="textarea"
            label="Notes internes (optionnel)"
            placeholder="Informations utiles à l'équipe..."
            rows={2}
            error={errors.notes?.message}
            {...register('notes')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
