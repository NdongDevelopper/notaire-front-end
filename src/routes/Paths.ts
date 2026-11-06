import type { UserRole } from '../features/auth/types/auth.types';

// Re-exported so router files can `import type { UserRole } from './paths'`
// without reaching into the auth feature directly. Source of truth is
// still features/auth/types/auth.types.ts.
export type { UserRole };

export const STAFF_ROLES: UserRole[] = [
  'associe',
  'notaire',
  'juriste',
  'juriste_clerk',
  'clerk',
  'formaliste',
  'comptable',
  'assistant',
  'stagiaire',
  'agent',
  'administrateur',
  'collaborateur',
];

export const CLIENT_ROLES: UserRole[] = ['client'];

export const PATHS = {
  home: '/',
  login: '/login',
  register: '/register',

  // Staff (notarial) space
  dashboard: '/dashboard',
  dashboardClients: '/dashboard/clients',
  dashboardDossiers: '/dashboard/dossiers',
  dashboardDossierDetails: (id: string) => `/dashboard/dossiers/${id}`,
  dashboardKanban: '/dashboard/kanban',
  dashboardTaches: '/dashboard/taches',
  dashboardFinances: '/dashboard/finances',
  dashboardModeles: '/dashboard/modele',
  dashboardSettings: '/dashboard/settings',

  // Client portal
  espaceClient: '/espace-client',
  espaceClientDossiers: '/espace-client/dossiers',
  espaceClientDossierDetails: (id: string) => `/espace-client/dossiers/${id}`,
  espaceClientPieces: '/espace-client/pieces',
  espaceClientDocuments: '/espace-client/documents',
  espaceClientMessages: '/espace-client/messages',
  espaceClientRendezVous: '/espace-client/rendez-vous',
  espaceClientPaiements: '/espace-client/paiements',
  espaceClientProfil: '/espace-client/profil',
  espaceClientAide: '/espace-client/aide',
} as const;

/**
 * Returns the correct "home" route for a given role, used for post-login
 * redirects and for bouncing a user out of a branch they don't belong in.
 */
export function getHomeRouteForRole(role: UserRole): string {
  return CLIENT_ROLES.includes(role) ? PATHS.espaceClient : PATHS.dashboard;
}