export type SettingsTabId = 'users' | 'roles' | 'document-types' | 'company-info';

// src/features/settings/types/settings.ts (ou ajuste selon ton fichier)
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'associe' | 'notaire' | 'juriste' | 'formaliste' | 'comptable' | 'assistant' | 'stagiaire' | 'agent' | 'administrateur' | 'collaborateur';
  telephone: string;
  is_active: boolean;
  created_at?: string;
}

export interface CreateTypeActePayload {
  code: string;
  libelle: string;
  actif: boolean;
}

export interface EtapeWorkflow {
  id: number;
  type_acte: number;
  nom: string;
  ordre: number;
  obligatoire: boolean;
  delai_jours: number;
}

export interface ChecklistPiece {
  id: number;
  type_acte: number;
  libelle_piece: string;
  obligatoire: boolean;
}

export interface TypeActeResponse {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
  // Renvoyés imbriqués par GET /types-actes/
  etapes?: EtapeWorkflow[];
  checklist?: ChecklistPiece[];
}

export interface CreateEtapePayload {
  type_acte: number;
  nom: string;
  ordre: number;
  obligatoire: boolean;
  delai_jours: number;
}

export interface CreateChecklistPiecePayload {
  type_acte: number;
  libelle_piece: string;
  obligatoire: boolean;
}

// ---------------------------------------------------------------------------
// Étude (informations de l'étude — singleton)
// Noms de champs supposés (snake_case Django) — à ajuster si le backend diffère.
// ---------------------------------------------------------------------------
export interface Etude {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  format_numerotation: string;
}

export type EtudePayload = Omit<Etude, 'id'>;

export interface PaginatedUsers {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

// ---------------------------------------------------------------------------
// Permissions (matrice rôle × module × action)
// ---------------------------------------------------------------------------

/** Une permission élémentaire renvoyée par GET /permissions/ (?role=&module=). */
export interface Permission {
  id: string;
  role: string;
  module: string;
  action: string;
  allowed: boolean;
}

/**
 * Matrice groupée renvoyée par GET /permissions/matrice/
 * Forme : { role: { module: { action: bool } } }
 */
export type PermissionMatrice = Record<string, Record<string, Record<string, boolean>>>;

/** Listes des valeurs disponibles renvoyées par GET /permissions/choix/ */
export interface PermissionChoix {
  roles: string[];
  modules: string[];
  actions: string[];
}
