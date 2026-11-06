import type { UserRole } from '../../features/auth/types/auth.types';

export type PermissionAction =
  | 'voir'
  | 'creer'
  | 'modifier'
  | 'supprimer'
  | 'exporter'
  | 'valider'
  | 'affecter'
  | 'archiver';

const ACTIONS: PermissionAction[] = [
  'voir', 'creer', 'modifier', 'supprimer', 'exporter', 'valider', 'affecter', 'archiver',
];

type PermissionSet = Record<PermissionAction, boolean>;

const allTrue = (): PermissionSet =>
  ACTIONS.reduce((acc, action) => ({ ...acc, [action]: true }), {} as PermissionSet);

const allFalse = (): PermissionSet =>
  ACTIONS.reduce((acc, action) => ({ ...acc, [action]: false }), {} as PermissionSet);

/**
 * Matrice de permissions par rôle métier — fournie telle quelle, inchangée.
 * C'est le contrôle de base : "ce type d'action est-il possible pour ce rôle,
 * en général ?". Les restrictions spécifiques à une ressource (dossier, tâche,
 * finance, pièce) sont gérées séparément par RESOURCE_ROLE_ALLOWLIST plus bas,
 * conformément au CDC (§8, §11, §13, §15).
 */
export const PERMISSION_MATRIX: Partial<Record<UserRole, PermissionSet>> = {
  associe: allTrue(),
  juriste: {
    voir: true, creer: true, modifier: true, supprimer: false,
    exporter: true, valider: false, affecter: true, archiver: false,
  },
  formaliste: {
    voir: true, creer: true, modifier: true, supprimer: false,
    exporter: true, valider: false, affecter: false, archiver: false,
  },
  comptable: {
    voir: true, creer: true, modifier: true, supprimer: false,
    exporter: true, valider: false, affecter: false, archiver: false,
  },
  assistant: {
    voir: true, creer: true, modifier: false, supprimer: false,
    exporter: false, valider: false, affecter: false, archiver: false,
  },
  stagiaire: {
    voir: true, creer: false, modifier: false, supprimer: false,
    exporter: false, valider: false, affecter: false, archiver: false,
  },
  agent: {
    voir: true, creer: false, modifier: true, supprimer: false,
    exporter: false, valider: false, affecter: false, archiver: false,
  },
};

/**
 * Alias de rôles, déduits du CDC (§3 "Profils utilisateurs" et §18) :
 * - "Associé / Notaire" est présenté comme UN SEUL profil de pilotage (§3) →
 *   notaire hérite des droits d'associe.
 * - "Associé / administrateur" gère les paramètres de l'étude (§18) →
 *   administrateur hérite des droits d'associe.
 * - "Juriste / Clerk" est présenté comme UN SEUL profil opérationnel (§3) →
 *   clerk et juriste_clerk héritent des droits de juriste.
 * - "collaborateur" n'apparaît dans aucun parcours du CDC : faute de définition
 *   métier, on l'aligne par prudence sur le profil le plus restreint (stagiaire :
 *   voir seul). À corriger si ce rôle a un sens précis dans votre organisation.
 */
const ROLE_ALIASES: Partial<Record<UserRole, UserRole>> = {
  notaire: 'associe',
  administrateur: 'associe',
  clerk: 'juriste',
  juriste_clerk: 'juriste',
  collaborateur: 'stagiaire',
};

const DEFAULT_PERMISSIONS: PermissionSet = allFalse();

const normalizeRole = (role: string | undefined | null): UserRole | null => {
  if (!role) return null;
  const normalized = role.toLowerCase().trim() as UserRole;
  return ROLE_ALIASES[normalized] ?? normalized;
};

export const getPermissionSet = (role: string | undefined | null): PermissionSet => {
  const resolved = normalizeRole(role);
  if (!resolved) return DEFAULT_PERMISSIONS;
  return PERMISSION_MATRIX[resolved] ?? DEFAULT_PERMISSIONS;
};

/**
 * Vérifie si un rôle donné a le droit d'effectuer une action, tous modules
 * confondus (contrôle générique — utiliser hasResourcePermission pour les
 * modules avec restriction CDC spécifique : dossier, finance, piece).
 * Retourne false par défaut (fail-safe) si le rôle est inconnu ou absent.
 */
export const hasPermission = (role: string | undefined | null, action: PermissionAction): boolean => {
  return getPermissionSet(role)[action];
};

/**
 * Ressources métier avec une restriction d'accès propre au CDC, en plus de la
 * matrice d'actions générique. `null` = pas de restriction supplémentaire,
 * seule la matrice d'actions s'applique (ex: tâches, "tous profils internes", §13).
 *
 * Sources CDC :
 * - dossier (§8 "Ouverture d'un dossier") : Associé, juriste, assistant
 * - finance (§15 "Suivi financier") : "Seuls associés et comptable modifient les finances"
 * - piece   (§11 "Pièces et GED")   : Associé, juriste, assistant, formaliste
 * - tache   (§13 "Tâches")          : Tous profils internes → pas de restriction
 */
export type PermissionResource = 'dossier' | 'tache' | 'finance' | 'piece';

const RESOURCE_ROLE_ALLOWLIST: Partial<Record<PermissionResource, UserRole[]>> = {
  dossier: ['associe', 'juriste', 'assistant'],
  finance: ['associe', 'comptable'],
  piece: ['associe', 'juriste', 'assistant', 'formaliste'],
  // tache: pas d'entrée -> aucune restriction de ressource, matrice d'actions seule
};

/**
 * Vérifie une permission pour une ressource métier précise : l'action doit être
 * autorisée par la matrice de rôle ET le rôle doit être dans la liste des
 * profils concernés par cette ressource (si une restriction existe).
 */
export const hasResourcePermission = (
  role: string | undefined | null,
  resource: PermissionResource,
  action: PermissionAction,
): boolean => {
  if (!hasPermission(role, action)) return false;

  const allowlist = RESOURCE_ROLE_ALLOWLIST[resource];
  if (!allowlist) return true; // pas de restriction pour cette ressource

  const resolved = normalizeRole(role);
  if (!resolved) return false;
  return allowlist.includes(resolved);
};