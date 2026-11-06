/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addUserSchema, type AddUserInput, ROLE_OPTIONS } from '../../types/addUser.schema';
import { useAddUser } from '../../hooks/useAddUser';
import { useUpdateUser } from '../../hooks/useUpdateUser';
import { type User } from '../../types/settings';

interface AddUserFormProps {
  initialData?: User;
  onSubmitSuccess: (data: any) => void;
  onCancel: () => void;
}

export const AddUserForm: React.FC<AddUserFormProps> = ({ initialData, onSubmitSuccess, onCancel }) => {
  const { mutate: createUser, isPending: isCreating } = useAddUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();

  const isEditing = !!initialData;
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddUserInput>({
    resolver: zodResolver(addUserSchema),
    defaultValues:
      isEditing && initialData
        ? {
            username: initialData.username,
            email: initialData.email,
            first_name: initialData.first_name || '',
            last_name: initialData.last_name || '',
            role: initialData.role as any, // Cast sécurisé pour s'aligner sur le schéma
            telephone: initialData.telephone || '',
          }
        : {
            username: '',
            email: '',
            first_name: '',
            last_name: '',
            role: 'associe',
            telephone: '',
          },
  });

  const onSubmit = (data: AddUserInput) => {
    if (isEditing && initialData) {
      updateUser(
        { id: initialData.id, data },
        {
          onSuccess: () => {
            onSubmitSuccess(data);
          },
        }
      );
    } else {
      createUser(data, {
        onSuccess: () => {
          onSubmitSuccess(data);
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Prénom */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text uppercase tracking-wider">Prénom</label>
          <input
            type="text"
            placeholder="Jean"
            {...register('first_name')}
            className={`w-full bg-white border ${errors.first_name ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-100'} text-text text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-activeBtn transition-all`}
          />
          {errors.first_name && <span className="text-xs font-medium text-red-500">{errors.first_name.message}</span>}
        </div>

        {/* Nom */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text uppercase tracking-wider">Nom</label>
          <input
            type="text"
            placeholder="Kane"
            {...register('last_name')}
            className={`w-full bg-white border ${errors.last_name ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-100'} text-text text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-activeBtn transition-all`}
          />
          {errors.last_name && <span className="text-xs font-medium text-red-500">{errors.last_name.message}</span>}
        </div>

        {/* Nom d'utilisateur */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-text uppercase tracking-wider">Nom d'utilisateur</label>
          <input
            type="text"
            placeholder="jkane"
            readOnly={isEditing}
            {...register('username')}
            className={`w-full border ${errors.username ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-100'} ${isEditing ? 'bg-slate-50 text-text-muted cursor-not-allowed select-none' : 'bg-white text-text'} text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-activeBtn transition-all`}
          />
          {errors.username && <span className="text-xs font-medium text-red-500">{errors.username.message}</span>}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-text uppercase tracking-wider">Adresse Email</label>
          <input
            type="email"
            placeholder="jkane@notaire.com"
            readOnly={isEditing}
            {...register('email')}
            className={`w-full border ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-100'} ${isEditing ? 'bg-slate-50 text-text-muted cursor-not-allowed select-none' : 'bg-white text-text'} text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-activeBtn transition-all`}
          />
          {errors.email && <span className="text-xs font-medium text-red-500">{errors.email.message}</span>}
        </div>

        {/* Téléphone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text uppercase tracking-wider">Téléphone</label>
          <input
            type="text"
            placeholder="771234567"
            {...register('telephone')}
            className={`w-full bg-white border ${errors.telephone ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-100'} text-text text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-activeBtn transition-all`}
          />
          {errors.telephone && <span className="text-xs font-medium text-red-500">{errors.telephone.message}</span>}
        </div>

        {/* Rôle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text uppercase tracking-wider">Rôle</label>
          <div className="relative w-full">
            <select {...register('role')} className="w-full bg-white border border-slate-200 text-text text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-activeBtn transition-all appearance-none cursor-pointer">
              {ROLE_OPTIONS?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          {errors.role && <span className="text-xs font-medium text-red-500">{errors.role.message}</span>}
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-slate-50 border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto bg-activeBtn hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
        >
          {isPending ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Créer l’utilisateur'}
        </button>
      </div>
    </form>
  );
};
