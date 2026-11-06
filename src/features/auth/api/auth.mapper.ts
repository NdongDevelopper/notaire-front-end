import type {
  AuthUser,
  AuthUserDTO,
  LoginResponseDTO,
  MeResponseDTO,
  RefreshResponseDTO,
} from '../types/auth.types';

export function extractAccessToken(dto: LoginResponseDTO | RefreshResponseDTO): string | null {
  // Handle different token field names from backend
  return dto.access ?? dto.access_token ?? dto.token ?? null;
}

function getDisplayName(dto: Partial<AuthUserDTO> & { nom?: string }): {
  firstName: string;
  lastName: string;
} {
  const directFirstName = dto.first_name?.trim();
  const directLastName = dto.last_name?.trim();
  const fullName = dto.nom?.trim();

  if (directFirstName || directLastName) {
    return {
      firstName: directFirstName ?? '',
      lastName: directLastName ?? '',
    };
  }

  if (fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return { firstName: '', lastName: '' };
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  return { firstName: '', lastName: '' };
}

// Valeurs par défaut prudentes tant que /auth/me/ n'a pas encore été appelé
// (ex: juste après le login, avant le premier rafraîchissement du profil).
// Correspond exactement à la forme renvoyée par MeView côté backend.
const PERMISSIONS_PAR_DEFAUT = {
  peut_creer_dossier: false,
  peut_creer_tache: false,
  peut_creer_modele_acte: false,
  peut_supprimer_modele_acte: false,
  peut_valider_modele_acte: false,
  peut_gerer_utilisateurs: false,
  peut_gerer_parametres_etude: false,
  peut_exporter: false,
};

export function mapAuthUserDtoToUser(dto: AuthUserDTO): AuthUser {
  const { firstName, lastName } = getDisplayName(dto);

  return {
    id: dto.id,
    username: dto.username ?? dto.email ?? '',
    email: dto.email ?? '',
    firstName,
    lastName,
    role: dto.role,
    telephone: dto.telephone,
    isActive: dto.is_active ?? true,
    isSuperuser: dto.is_superuser ?? false,
    changerLeMotDePasse: dto.doit_changer_mot_de_passe,
    // dto.permissions vient de GET /api/auth/me/. Absent uniquement si le
    // backend n'a pas encore été redéployé avec ce champ - dans ce cas on
    // reste sur des permissions fermées par défaut plutôt que de tout ouvrir.
    permissions: dto.permissions ?? PERMISSIONS_PAR_DEFAUT,
  };
}

function mapMinimalLoginResponseToUser(dto: LoginResponseDTO): AuthUser {
  const { firstName, lastName } = getDisplayName(dto);
  const fallbackName = dto.nom?.trim() || dto.email || 'Utilisateur';

  return {
    id: dto.id ?? '',
    username: dto.username ?? dto.email ?? fallbackName,
    email: dto.email ?? '',
    firstName: firstName || fallbackName,
    lastName,
    role: dto.role ?? 'collaborateur',
    telephone: dto.telephone,
    isActive: dto.is_active ?? true,
    isSuperuser: false,
    changerLeMotDePasse: dto.changer_le_mot_de_passe ?? dto.doit_changer_mot_de_passe,
    // La réponse de login ne contient pas les permissions détaillées.
    // authService.login() doit enchaîner sur un appel à /auth/me/ pour les
    // obtenir - voir auth.service.ts. En attendant, on reste fermé.
    permissions: PERMISSIONS_PAR_DEFAUT,
  };
}

export function mapLoginResponseToUser(dto: LoginResponseDTO): AuthUser {
  const userDto = dto.user ?? (dto.id ? (dto as AuthUserDTO) : null);

  if (userDto?.email && userDto.first_name && userDto.last_name) {
    return mapAuthUserDtoToUser(userDto);
  }

  if (dto.role || dto.nom || dto.changer_le_mot_de_passe !== undefined) {
    return mapMinimalLoginResponseToUser(dto);
  }

  throw new Error('La reponse de connexion ne contient pas les informations utilisateur.');
}

export function mapMeResponseToUser(dto: MeResponseDTO): AuthUser {
  return mapAuthUserDtoToUser(dto);
}