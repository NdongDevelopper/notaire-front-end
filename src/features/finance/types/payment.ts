// types/payment.ts
// Représente un paiement (règlement) enregistré sur un dossier
// (cahier des charges §15: montant, date, mode, référence, reçu, enregistré par).

import type { ModePaiement } from "./finance";
import type { LigneFinanciere } from "./invoice";

export interface Paiement {
  id: string; // UUID
  dossier: string; // UUID du dossier
  // Libellé lisible du dossier (ex: "2026-VENTE-0001"), à faire renvoyer par
  // l'API (jointure côté backend) pour éviter d'afficher "Inconnu" côté UI.
  dossier_numero?: string;
  montant: number;
  date_paiement: string; // ISO date (YYYY-MM-DD)
  mode: ModePaiement;
  mode_display?: string; // Display label from API
  reference?: string;
  recu_url?: string; // lien vers le reçu généré (P1)
  enregistre_par?: string; // User ID
  enregistre_par_nom?: string; // User name
  created_at?: string;
  updated_at?: string;
}

// Payload d'entrée pour la création d'un paiement.
export interface PaiementInput {
  dossier: string;
  montant: number;
  date_paiement: string;
  mode: ModePaiement;
  reference?: string;
}

export interface PaiementFormState {
  montant: string;
  date_paiement: string;
  mode: ModePaiement | "";
  reference: string;
}

export const PAIEMENT_FORM_INITIAL: PaiementFormState = {
  montant: "",
  date_paiement: "",
  mode: "",
  reference: "",
};

// Réponse de l'endpoint GET /api/paiements/situation/<dossier_id>/
export interface SituationFinanciere {
  dossier: string;
  total_facture: number;
  total_paye: number;
  reste_a_payer: number;
  statut_financier: string; // Changed from 'statut' to match API
  lignes?: LigneFinanciere[]; // Made optional as API might not include
  paiements?: Paiement[]; // Made optional as API might not include
}
