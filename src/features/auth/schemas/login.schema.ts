import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est obligatoire.")
    .email('Adresse email invalide.'),
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
