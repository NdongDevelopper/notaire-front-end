export type UserRole =
  | 'associe'
  | 'notaire'
  | 'juriste'
  | 'juriste_clerk'
  | 'clerk'
  | 'formaliste'
  | 'comptable'
  | 'assistant'
  | 'stagiaire'
  | 'agent'
  | 'administrateur'
  | 'client'
  | 'collaborateur';

/**
 * Droits calculés côté serveur, renvoyés par GET /api/auth/me/
 * (voir core.views.MeView). Ne jamais recalculer ces droits à partir du rôle
 * côté client : c'est le backend qui a l'autorité finale sur qui peut faire
 * quoi, et cette forme doit rester synchronisée avec la réponse de l'API.
 */
export interface AuthUserPermissions {
  peut_creer_dossier: boolean;
  peut_creer_tache: boolean;
  peut_creer_modele_acte: boolean;
  peut_supprimer_modele_acte: boolean;
  peut_valider_modele_acte: boolean;
  peut_gerer_utilisateurs: boolean;
  peut_gerer_parametres_etude: boolean;
  peut_exporter: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  telephone?: string;
  isActive: boolean;
  isSuperuser: boolean;
  changerLeMotDePasse?: boolean;
  permissions: AuthUserPermissions;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUserDTO {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  nom?: string;
  role: UserRole;
  telephone?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  doit_changer_mot_de_passe?: boolean;
  permissions?: AuthUserPermissions;
}

export type LoginResponseDTO = Partial<AuthUserDTO> & {
  access?: string;
  access_token?: string;
  token?: string;
  refresh?: string;
  refresh_token?: string;
  user?: AuthUserDTO;
  role?: UserRole;
  nom?: string;
  changer_le_mot_de_passe?: boolean;
};

export type MeResponseDTO = AuthUserDTO;

export interface RefreshResponseDTO {
  access?: string;
  access_token?: string;
  token?: string;
}

export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  failedLoginAttempts: number;
}