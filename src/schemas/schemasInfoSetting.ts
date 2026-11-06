import z from 'zod';

export const companyInfoSchema = z.object({
  nomEtude: z.string().min(3, "Le nom de l'étude est requis (min. 3 caractères)"),
  adresse: z.string().min(5, "L'adresse du siège est requise"),
  telephone: z.string().regex(/^\+?[0-9\s]+$/, 'Format de téléphone invalide'),
  email: z.string().email("L'adresse email n'est pas valide"),
  formatNumerotation: z.string().min(1, 'Le format de numérotation est requis'),
});
