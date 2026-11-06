import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../../shared/components/ui/Modal/Modal';
import { useAddTypeActe } from '../../hooks/useAddTypeActe';
import { useUpdateTypeActe } from '../../hooks/useUpdateTypeActe';
import { TypeActeResponse } from '../../types/settings';

const typeActeSchema = z.object({
  libelle: z.string().trim().min(3, 'Le libellé doit contenir au moins 3 caractères'),
});

type TypeActeFormData = z.infer<typeof typeActeSchema>;

interface TypeActeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  typeActe?: TypeActeResponse | null;
}

const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const TypeActeFormModal: React.FC<TypeActeFormModalProps> = ({ isOpen, onClose, typeActe }) => {
  const { mutateAsync: addTypeActe } = useAddTypeActe();
  const { mutateAsync: updateTypeActe } = useUpdateTypeActe(); // 👈 Initialisation de la modification

  const isEditMode = !!typeActe;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TypeActeFormData>({
    resolver: zodResolver(typeActeSchema),
    defaultValues: {
      libelle: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (typeActe) {
        reset({ libelle: typeActe.libelle });
      } else {
        reset({ libelle: '' });
      }
    }
  }, [isOpen, typeActe, reset]);

  const handleFormSubmit = async (data: TypeActeFormData) => {
    try {
      if (isEditMode && typeActe) {
        // 🔥 Exécution de la modification PATCH avec les bonnes données
        await updateTypeActe({ id: typeActe.id, libelle: data.libelle });
        console.log('Modification réussie !');
      } else {
        const generatedCode = slugify(data.libelle);
        const finalPayload = {
          code: generatedCode,
          libelle: data.libelle,
          actif: true,
        };
        await addTypeActe(finalPayload);
        console.log('Création réussie !');
      }

      reset();
      onClose();
    } catch (error) {
      console.error('Échec de la soumission du formulaire', error);
    }
  };

  const modalFooter = (
    <div className="flex justify-end gap-3 w-full">
      <button
        type="button"
        onClick={() => {
          reset();
          onClose();
        }}
        disabled={isSubmitting}
        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
      >
        Annuler
      </button>
      <button type="submit" form="add-type-acte-form" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-activeBtn rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50">
        {isSubmitting ? (isEditMode ? 'Enregistrement...' : 'Création...') : isEditMode ? 'Enregistrer les modifications' : "Créer le type d'acte"}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) {
          reset();
          onClose();
        }
      }}
      title={isEditMode ? "Modifier le type d'acte" : "Nouveau type d'acte"}
      size="md"
      footer={modalFooter}
    >
      <form id="add-type-acte-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <p className="text-sm text-text-muted mb-4">
          {isEditMode
            ? "Modifiez le libellé de ce type d'acte. Les changements s'appliqueront immédiatement à l'ensemble du workflow."
            : "Ajoutez un nouveau type d'acte pour l'étude. Vous pourrez configurer son workflow (étapes et documents requis) juste après sa création."}
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="libelle" className="text-sm font-semibold text-text">
            Libellé <span className="text-red-500">*</span>
          </label>
          <input
            id="libelle"
            type="text"
            disabled={isSubmitting}
            placeholder='Ex: "Acte de vente", "Bail commercial"'
            {...register('libelle')}
            className={`w-full px-3 py-2 border rounded-lg text-sm text-text bg-white outline-none transition-all focus:border-activeBtn focus:ring-1 focus:ring-activeBtn ${
              errors.libelle ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200'
            } disabled:bg-slate-50 disabled:text-slate-400`}
          />
          {errors.libelle && <span className="text-xs font-medium text-red-500 mt-0.5">{errors.libelle.message}</span>}
        </div>
      </form>
    </Modal>
  );
};
