// types/invoice.ts
// Représente une "ligne financière" du dossier: honoraires, débours,
// droits/taxes, frais administratifs ou autres (cahier des charges §15).

import type { CategorieFinanciere } from "./finance";

export interface LigneFinanciere {
  id: string; // UUID
  dossier: string; // UUID du dossier
  // Libellé lisible du dossier (ex: "2026-VENTE-0001"), à faire renvoyer par
  // l'API (jointure côté backend) pour éviter d'afficher "Inconnu" côté UI.
  dossier_numero?: string;
  categorie: CategorieFinanciere;
  categorie_display?: string; // Display label from API
  libelle: string;
  montant: number;
  created_at?: string; // ISO date
  updated_at?: string; // ISO date
}

// Payload d'entrée pour la création / modification d'une ligne financière.
export interface LigneFinanciereInput {
  dossier: string;
  categorie: CategorieFinanciere;
  libelle: string;
  montant: number;
}

export interface LigneFinanciereFormState {
  categorie: CategorieFinanciere | "";
  libelle: string;
  montant: string; // valeur brute du champ de saisie, convertie avant envoi
}

export const LIGNE_FINANCIERE_FORM_INITIAL: LigneFinanciereFormState = {
  categorie: "",
  libelle: "",
  montant: "",
};
