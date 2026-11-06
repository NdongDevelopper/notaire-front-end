export interface TypeActe {
  id: number;
  code: string;
  libelle: string;
  actif: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  telephone?: string;
}

export interface Client {
  id: string;
  type_client: 'physique' | 'morale';
  nom: string;
  email: string;
  telephone: string;
  adresse?: string;
  notes?: string;
}

export interface Dossier {
  id: string;
  numero?: string;
  type_acte: number | TypeActe;
  objet: string;
  statut: string;
  priorite: 'basse' | 'normale' | 'haute';
  client: string | Client;
  responsable: string | User;
  montant: number;
  date_cible: string;
  description?: string;
  notes?: string;
  created_at?: string;
  parties?: DossierParty[];
  taches?: DossierTask[];
  documents?: DossierDocument[];
}

export interface DossierParty {
  id?: string | number;
  dossier?: string | number | null;
  client?: string | Client | null;
  role?: string;
  nom?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DossierTask {
  id?: string | number;
  dossier?: string | number | null;
  titre: string;
  description?: string;
  assigne_a?: string | User | null; // AJOUTÉ - responsable de la tâche
  date_echeance?: string | null;
  statut: 'a_faire' | 'en_cours' | 'termine' | 'en_attente' | 'annule' | string;
  priorite?: 'basse' | 'normale' | 'haute' | string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | User | null; // AJOUTÉ - créateur de la tâche
}

export interface DossierDocument {
  id?: string | number;
  dossier?: string | number | null;
  nom: string;
  fichier?: string | null;
  type_piece?: string;
  statut?: 'manquant' | 'recu' | 'valide' | string;
  // Catégorie du document (confirmée côté backend — DocumentSerializer renvoie
  // `categorie`: "acte_signe" et `categorie_display`: "Acte signé"). La valeur
  // "acte_signe" déclenche le scellement d'intégrité côté backend
  // (integrite/signals.py + dossiers/views.py).
  categorie?: string;
  categorie_display?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export type DossierStatusValue =
  | 'ouvert'
  | 'pieces_en_cours'
  | 'redaction'
  | 'validation'
  | 'signature'
  | 'formalites'
  | 'cloture'
  | 'archive'
  | string;

// --- AJOUTS POUR LE FRONTEND ---
export type CaseStatus =
  | 'OUVERT'
  | 'PIECES_EN_COURS'
  | 'REDACTION'
  | 'VALIDATION'
  | 'SIGNATURE'
  | 'FORMALITES'
  | 'CLOTURE'
  | 'ARCHIVE';

export interface CaseClient {
  id: string;
  name: string;
  role: string;
}

// INTERFACE UNIQUE (fusion des deux)
export interface Case {
  id: string;
  numero?: string;
  objet?: string;
  type: string;
  status: CaseStatus;
  responsible: string;
  priority?: string;
  createdAt: string;
  users?: string[];
  clients: CaseClient[];
}