import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type z from 'zod';
import { companyInfoSchema } from '../../../../schemas/schemasInfoSetting';
import { useEtude, useSaveEtude } from '../../hooks/useEtude';
import { useToast } from '../../../../shared/components/ui/Toast/Toast';
import { Skeleton } from '../../../../shared/components/ui/Skeleton/Skeleton';
import type { Etude, EtudePayload } from '../../types/settings';

type CompanyInfoValues = z.infer<typeof companyInfoSchema>;

const EMPTY_VALUES: CompanyInfoValues = {
  nomEtude: '',
  adresse: '',
  telephone: '',
  email: '',
  formatNumerotation: '',
};

/** Mapping API (snake_case) -> formulaire. */
const toFormValues = (etude: Etude): CompanyInfoValues => ({
  nomEtude: etude.nom ?? '',
  adresse: etude.adresse ?? '',
  telephone: etude.telephone ?? '',
  email: etude.email ?? '',
  formatNumerotation: etude.format_numerotation ?? '',
});

/** Mapping formulaire -> API (snake_case). */
const toApiPayload = (values: CompanyInfoValues): EtudePayload => ({
  nom: values.nomEtude,
  adresse: values.adresse,
  telephone: values.telephone,
  email: values.email,
  format_numerotation: values.formatNumerotation,
});

export const CompanyInfoForm: React.FC = () => {
  const toast = useToast();
  const { data: etude, isLoading, isError } = useEtude();
  const saveEtude = useSaveEtude();

  // DEBUG TEMPORAIRE — à retirer
  console.log('DEBUG etude reçue du backend =', etude);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyInfoValues>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: EMPTY_VALUES,
  });

  // Pré-remplit le formulaire dès que l'étude est chargée.
  useEffect(() => {
    if (etude) reset(toFormValues(etude));
  }, [etude, reset]);

  const onSubmit = async (data: CompanyInfoValues) => {
    try {
      await saveEtude.mutateAsync({ id: etude?.id, data: toApiPayload(data) });
      toast.success("Les informations de l'étude ont été enregistrées.");
    } catch (error) {
      console.error("Échec de l'enregistrement de l'étude :", error);
      toast.error("L'enregistrement a échoué. Veuillez réessayer.");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-8 max-w-3xl w-full">
        <Skeleton className="h-7 w-56 mb-6" />
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm max-w-3xl w-full">
        Impossible de charger les informations de l'étude. Vérifiez votre connexion au serveur.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-8 max-w-3xl w-full">
      <h2 className="text-xl font-bold text-text mb-6">Paramètres de l'Étude</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nom de l'étude */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nomEtude" className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Nom de l'étude
          </label>
          <input
            id="nomEtude"
            type="text"
            className={`w-full border rounded-lg p-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-activeBtn/20 focus:border-activeBtn ${errors.nomEtude ? 'border-red-500' : 'border-slate-200'}`}
            {...register('nomEtude')}
          />
          {errors.nomEtude && <span className="text-xs text-red-500 font-medium">{errors.nomEtude.message}</span>}
        </div>

        {/* Adresse */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="adresse" className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Adresse Siège
          </label>
          <textarea
            id="adresse"
            rows={3}
            className={`w-full border rounded-lg p-3 text-sm text-text outline-none transition-colors resize-none focus:ring-2 focus:ring-activeBtn/20 focus:border-activeBtn ${errors.adresse ? 'border-red-500' : 'border-slate-200'}`}
            {...register('adresse')}
          />
          {errors.adresse && <span className="text-xs text-red-500 font-medium">{errors.adresse.message}</span>}
        </div>

        {/* Téléphone & Email (Grid sur 2 colonnes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="telephone" className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Téléphone
            </label>
            <input
              id="telephone"
              type="text"
              className={`w-full border rounded-lg p-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-activeBtn/20 focus:border-activeBtn ${errors.telephone ? 'border-red-500' : 'border-slate-200'}`}
              {...register('telephone')}
            />
            {errors.telephone && <span className="text-xs text-red-500 font-medium">{errors.telephone.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Email Contact
            </label>
            <input
              id="email"
              type="email"
              className={`w-full border rounded-lg p-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-activeBtn/20 focus:border-activeBtn ${errors.email ? 'border-red-500' : 'border-slate-200'}`}
              {...register('email')}
            />
            {errors.email && <span className="text-xs text-red-500 font-medium">{errors.email.message}</span>}
          </div>
        </div>

        {/* Format Numérotation */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="formatNumerotation" className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Format Numérotation
          </label>
          <input
            id="formatNumerotation"
            type="text"
            className={`w-full border rounded-lg p-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-activeBtn/20 focus:border-activeBtn ${errors.formatNumerotation ? 'border-red-500' : 'border-slate-200'}`}
            {...register('formatNumerotation')}
          />
          <span className="text-xs italic text-text-muted/70">
            Variables disponibles : {'{YYYY}'}, {'{ID}'}, {'{TYPE}'}
          </span>
          {errors.formatNumerotation && <span className="text-xs text-red-500 font-medium">{errors.formatNumerotation.message}</span>}
        </div>

        {/* Bouton de soumission */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-activeBtn hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
};
