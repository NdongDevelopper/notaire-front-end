import { z } from 'zod';

const phoneRegex = /^(7[0-8])\d{7}$/; // Senegalese mobile numbers, e.g. 770000001

export const clientFormSchema = z.object({
  type: z.enum(['physique', 'morale'], {
    message: 'Le type de client est requis.',
  }),

  nom: z
    .string()
    .min(1, 'Ce champ est requis.')
    .max(150, 'Ce champ ne doit pas dépasser 150 caractères.'),

  telephone: z
    .string()
    .min(1, 'Le téléphone est requis.')
    .transform((val) => val.replace(/\s+/g, ''))
    .refine((val) => phoneRegex.test(val), {
      message:
        'Le numéro de téléphone doit être un numéro sénégalais valide (ex: 77 000 00 00).',
    }),

  email: z
    .string()
    .min(1, "L'email est requis.")
    .email('Adresse email invalide.'),

  adresse: z
    .string()
    .min(1, "L'adresse est requise.")
    .max(255, "L'adresse ne doit pas dépasser 255 caractères."),

  notes: z
    .string()
    .max(500, 'Les notes ne doivent pas dépasser 500 caractères.')
    .optional()
    .or(z.literal('')),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;