import type { DossierDocument } from "../types/case";

export interface ChecklistPiece {
  id: number;
  nom: string;
  type_piece: string;
  obligatoire: boolean;
}

export interface DocumentWithStatus extends DossierDocument {
  statut_calcule: 'manquant' | 'recu' | 'a_verifier' | 'valide' | 'rejete' | 'expiree';
  nom_checklist?: string;
  obligatoire?: boolean;
  type_piece?: string;
}