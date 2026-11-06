// types/models.ts
// Types du module "Modèles d'actes" (cahier des charges §12 et §18).

// ---------------------------------------------------------------------------
// Types d'actes (catégories) — endpoint /api/types-actes/
// ---------------------------------------------------------------------------

export interface TypeActe {
  id: number;
  code: string; // ex: "vente", "succession", "donation", "bail"
  libelle: string; // ex: "Vente", "Succession"
  actif: boolean;
}

export interface TypeActeInput {
  code: string;
  libelle: string;
  actif: boolean;
}

// Valeur spéciale du filtre de catégories pour "Tous"
export const CATEGORIE_TOUS = "tous";

// ---------------------------------------------------------------------------
// Étapes de workflow par type d'acte — endpoint /api/etapes-workflow/
// (Paramétrage du workflow personnalisable, cahier des charges §10 et §18)
// ---------------------------------------------------------------------------

export interface EtapeWorkflow {
  id: number;
  type_acte: number; // FK vers TypeActe.id
  nom: string;
  ordre: number;
  obligatoire?: boolean;
}

export interface EtapeWorkflowInput {
  type_acte: number;
  nom: string;
  ordre: number;
  obligatoire?: boolean;
}

// ---------------------------------------------------------------------------
// Checklist des pièces attendues par type d'acte — endpoint /api/checklist-pieces/
// (cahier des charges §11 et §18)
// ---------------------------------------------------------------------------

export interface ChecklistPiece {
  id: number;
  type_acte: number; // FK vers TypeActe.id
  libelle: string;
  obligatoire?: boolean;
}

export interface ChecklistPieceInput {
  type_acte: number;
  libelle: string;
  obligatoire?: boolean;
}

// ---------------------------------------------------------------------------
// Informations de l'étude — endpoint /api/etude/
// (cahier des charges §18, utilisées comme variables d'actes: {{etude_nom}}...)
// ---------------------------------------------------------------------------

export interface Etude {
  id: number;
  nom: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  logo_url?: string;
  format_numerotation?: string;
}

export interface EtudeInput {
  nom: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  format_numerotation?: string;
}

// ---------------------------------------------------------------------------
// Modèles d'actes (contenu du document, avec variables dynamiques)
// NOTE: aucun endpoint dédié n'a été fourni pour la persistance du contenu
// des modèles. Le service `modelsApi.ts` suppose une ressource REST
// `/api/modeles-actes/` suivant la même convention que les autres endpoints
// du cahier des charges — à confirmer/ créer côté backend Django.
// ---------------------------------------------------------------------------

export type StatutModele = "Brouillon" | "A relire" | "Validé par juriste" | "Validé par associé" | "Finalisé" | "Archivé";

export interface ModeleActe {
  id: string;
  titre: string;
  type_acte: number | string; // peut être le code du TypeActe (ex: "vente") ou l'id numérique retourné par l'API
  contenu: string;
  variables: string[];
  statut?: StatutModele | string | null;
  version?: number | string | null;
  archive?: boolean | null;
  created_at?: string | null; // date ISO renvoyée par le backend lors de la création
  createdAt?: string | null;
  created_on?: string | null;
  createdOn?: string | null;
  updated_at?: string | null; // date ISO renvoyée par le backend lors de la mise à jour
  updatedAt?: string | null;
  updated_on?: string | null;
  updatedOn?: string | null;
  derniere_maj?: string | null; // date ISO
  derniereMaj?: string | null;
}

export interface ModeleActeInput {
  titre: string;
  type_acte: number | string;
  contenu: string;
  variables: string[];
}

// Variables suggérées par défaut selon le type d'acte, affichées dans
// l'éditeur tant que le backend ne renvoie pas un catalogue dynamique de
// variables par type d'acte.
export const VARIABLES_PAR_DEFAUT: Record<string, string[]> = {
  vente: ["vendeur", "acheteur", "montant", "date_signature", "num_tf", "lieu_immeuble"],
  succession: ["de_cujus", "liste_heritiers", "date_deces", "date_signature"],
  donation: ["donateur", "donataire", "bien_donne", "date_signature"],
  bail: ["bailleur", "locataire", "montant", "duree_bail", "date_signature"],
};

export function variablesSuggereesPour(typeActeCode: string): string[] {
  return VARIABLES_PAR_DEFAUT[typeActeCode] ?? ["montant", "date_signature"];
}

/**
 * Retourne le libellé d'un `type_acte` donné (id numérique ou code string)
 * en cherchant dans la liste `categories` fournie.
 */
export function libelleTypeActe(typeActe: number | string | undefined, categories: TypeActe[]): string | undefined {
  if (typeActe === undefined || typeActe === null || categories.length === 0) return undefined;
  const s = String(typeActe);
  const byCode = categories.find((c) => c.code === s);
  if (byCode) return byCode.libelle;
  const byId = categories.find((c) => String(c.id) === s);
  if (byId) return byId.libelle;
  return undefined;
}

export function formatDateFr(iso?: string | null): string {
  if (!iso) return "Date inconnue";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return date.toLocaleDateString("fr-FR");
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(new Date(value).getTime());
}

function getPremiereDateValide(...dates: Array<string | null | undefined>): string | null {
  for (const date of dates) {
    if (isValidDateString(date)) {
      return date;
    }
  }
  return null;
}

export function getModeleDate(modele: ModeleActe): string | null {
  const candidates = [
    modele.updated_at,
    modele.updatedAt,
    (modele as any).updated_on,
    (modele as any).updatedOn,
    modele.created_at,
    modele.createdAt,
    (modele as any).created_on,
    (modele as any).createdOn,
    modele.derniere_maj,
    modele.derniereMaj,
  ];

  const dateFromCandidates = getPremiereDateValide(...candidates);
  if (dateFromCandidates) return dateFromCandidates;

  for (const [key, value] of Object.entries(modele)) {
    if (/date|created|updated|maj|on/i.test(key) && isValidDateString(value)) {
      return value;
    }
  }

  return null;
}

/**
 * Extrait un aperçu court et propre du contenu d'un modèle (première partie
 * du texte, espaces normalisés), pour l'affichage sur les cartes.
 */
export function extraitContenu(contenu: string, maxLength = 120): string {
  const nettoye = contenu.replace(/\s+/g, " ").trim();
  if (!nettoye) return "Aucun contenu pour le moment.";
  if (nettoye.length <= maxLength) return nettoye;
  return `${nettoye.slice(0, maxLength).trimEnd()}…`;
}
