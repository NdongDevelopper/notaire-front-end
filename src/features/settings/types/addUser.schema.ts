import { z } from 'zod';

export const UserRoleEnum = z.enum(['associe', 'juriste', 'comptable', 'assistant', 'formaliste', 'stagiaire', 'agent']);

export const addUserSchema = z.object({
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(20, "Le nom d'utilisateur ne peut pas dépasser 20 caractères")
    .regex(/^[a-zA-Z0-9_]+$/, 'Seuls les lettres, chiffres et underscores (_) sont autorisés'),

  email: z.string().min(1, "L'adresse email est requise").email('Veuillez entrer une adresse email valide'),

  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(50, 'Le prénom est trop long'),

  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50, 'Le nom est trop long'),

  role: UserRoleEnum,

  // Validation simple pour un numéro de téléphone (ex: 9 chiffres ou format Sénégal standard)
  telephone: z
    .string()
    .min(1, 'Le numéro de téléphone est requis')
    .regex(/^(77|78|76|70|75|33)\d{7}$/, 'Veuillez entrer un numéro de téléphone sénégalais valide (ex: 771234567)'),
});

// Extraction du type TypeScript généré automatiquement à partir du schéma Zod
export type AddUserInput = z.infer<typeof addUserSchema>;

// Optionnel : Un tableau propre pour l'affichage de ton futur composant <select> (label + value)
export const ROLE_OPTIONS = [
  { value: 'associe', label: 'Associé / Notaire' },
  { value: 'juriste', label: 'Juriste / Clerc' },
  { value: 'formaliste', label: 'Formaliste' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'stagiaire', label: 'Stagiaire' },
  { value: 'agent', label: 'Agent / Coursier terrain' },
] as const;
