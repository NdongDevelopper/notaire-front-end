import type {
  Appointment,
  CertificatIntegrite,
  Client,
  Conversation,
  ConversationMessage,
  Dossier,
  DossierParty,
  Piece,
  PortalNotification,
  SharedDocument,
} from '../types/client.types';
import type { AuthUser } from '../../auth/types/auth.types';
import type {
  CertificatIntegriteDTO,
  ClientProfilDTO,
  ConversationDTO,
  ConversationMessageDTO,
  DossierDTO,
  NotificationDTO,
  PieceDTO,
  PieceStatutDTO,
  RendezVousDTO,
  SharedDocumentDTO,
} from './espaceClient.api';

// /api/portail/profil/ 404s on the deployed backend. Since the
// authenticated AuthUser (from /api/auth/me/, already loaded in the
// auth store before this feature ever mounts — see ProtectedRoute) is
// what got the user routed to /espace-client in the first place, use it
// directly instead of a second, currently-broken profile fetch.
//
// Fields NOT on AuthUser (address, civilStatus, type, createdAt) are
// left undefined — see the Client type's comments. Wire these up for
// real once a working profile endpoint exists.
export function mapAuthUserToClient(user: AuthUser): Client {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.telephone ?? '',
    email: user.email,
    username: user.username,
    role: user.role,
    // Additional field mappings for compatibility
    first_name: user.firstName,
    last_name: user.lastName,
    nom: user.lastName,
    telephone: user.telephone,
  };
}

const PIECE_STATUT_TO_CLIENT_STATUS: Record<PieceStatutDTO, Piece['clientStatus']> = {
  manquante: 'À fournir',
  a_verifier: 'En vérification',
  validee: 'Validée',
  rejetee: 'Rejetée',
};

export function mapPieceDTO(dto: PieceDTO): Piece {
  return {
    id: dto.id,
    dossierId: dto.dossier,
    dossierNumber: dto.dossier_numero,
    name: dto.nom,
    status: dto.statut === 'manquante' ? 'Manquante' : 'Reçue',
    clientStatus: PIECE_STATUT_TO_CLIENT_STATUS[dto.statut],
    typePiece: dto.type_piece,
    categorie: dto.categorie_display ?? dto.categorie,
    rejectionComment: dto.commentaire,
    fileUrl: dto.fichier,
    uploadedAt: dto.updated_at ?? dto.created_at,
    source: 'client',
  };
}

export function mapSharedDocumentDTO(dto: SharedDocumentDTO): SharedDocument {
  return {
    id: dto.id,
    dossierId: dto.dossier,
    dossierNumber: dto.dossier_numero,
    name: dto.nom,
    sharedAt: dto.created_at,
    fileUrl: dto.fichier,
    // `categorie` ("acte_signe") et `categorie_display` ("Acte signé") sont
    // confirmés sur /portail/documents-partages/ (DocumentPartageSerializer).
    categorie: dto.categorie ?? dto.categorie_display ?? dto.type,
    type: dto.categorie ?? dto.categorie_display ?? dto.type,
  };
}

/**
 * Résout un certificat d'intégrité. La charge utile réelle du backend
 * (integrite/services.py certificat_integrite) est prioritaire :
 *   - hash            ← hash_contenu (empreinte enregistrée du fichier)
 *   - sealedAt        ← horodatage_scellement
 *   - documentName    ← document.nom ; dossierNumber ← document.numero_dossier
 *   - verified        ← verification_document.conforme (empreinte actuelle ==
 *                       enregistrée), forcé à false si la chaîne est invalide
 *   - status          ← verification_chaine.statut_global ("valide"|"invalide")
 * Les alias (hash/empreinte/digest, date_scellement/scelle_le/sealed_at,
 * verifie/verified/valide, statut/status…) ne servent qu'à absorber d'autres
 * vocabulaires. Tous les champs restent optionnels : un certificat minimal
 * (empreinte seule) reste affichable.
 */
export function mapCertificatIntegriteDTO(dto: CertificatIntegriteDTO): CertificatIntegrite {
  const rapportDoc = dto.verification_document;
  const rapportChaine = dto.verification_chaine;
  const docRef = dto.document && typeof dto.document === 'object' ? dto.document : undefined;
  const documentRefStr = typeof dto.document === 'string' ? dto.document : undefined;

  // Conformité du fichier actuel vs empreinte enregistrée — la vraie preuve
  // d'intégrité ; `scelle` (un bloc existe) n'est qu'un repli moins fort.
  const conforme =
    typeof rapportDoc?.conforme === 'boolean' ? rapportDoc.conforme : undefined;
  const scelle = rapportDoc?.scelle ?? dto.scelle;
  const chaineValide = rapportChaine?.statut_global
    ? rapportChaine.statut_global === 'valide'
    : undefined;

  // Absorbe les vocabulaires alternatifs quand la charge utile réelle manque.
  const rawVerified = dto.verifie ?? dto.verified ?? dto.valide;
  const hasVerifiedText =
    typeof dto.statut === 'string' && /v[eé]rif|confirm|valide|scell/i.test(dto.statut);

  const verified =
    chaineValide === false
      ? false
      : conforme ?? scelle ?? rawVerified ?? hasVerifiedText;

  return {
    hash: dto.hash_contenu ?? dto.hash ?? dto.empreinte ?? dto.digest ?? dto.sha256,
    hashBloc: dto.hash_bloc_dernier,
    hashFichierActuel: rapportDoc?.hash_fichier_actuel,
    documentName: docRef?.nom ?? dto.document_nom ?? dto.nom_document ?? documentRefStr,
    sealedAt:
      dto.horodatage_scellement ??
      dto.date_scellement ??
      dto.scelle_le ??
      dto.sealed_at ??
      dto.horodatage ??
      dto.created_at,
    clientName: dto.client_nom ?? dto.client,
    dossierNumber: docRef?.numero_dossier ?? dto.dossier_numero ?? dto.dossier,
    verified,
    status: rapportChaine?.statut_global ?? dto.statut ?? dto.status,
    documentId: docRef?.id ?? dto.document_id ?? documentRefStr,
    etude: dto.etude,
    genereLe: dto.genere_le,
    nbBlocs:
      rapportChaine?.nb_blocs ?? dto.nb_blocs ?? dto.chaine_de_verification?.length,
    chaineValide,
  };
}

export function mapNotificationDTO(dto: NotificationDTO): PortalNotification {
  return {
    id: dto.id,
    clientId: dto.client ?? dto.client_id ?? '',
    title: dto.title ?? dto.titre ?? '',
    content: dto.body ?? dto.content ?? dto.contenu ?? '',
    createdAt: dto.created_at ?? dto.date_creation ?? new Date().toISOString(),
    isRead: dto.is_read ?? dto.lu ?? false,
    dossierId: dto.dossier ?? dto.dossier_id,
  };
}

export function mapClientProfilDTO(dto: ClientProfilDTO): Client {
  // Map from auth/me structure to Client interface
  const [firstName, ...rest] = (dto.nom || dto.first_name || '').split(' ');
  return {
    id: dto.id,
    type: 'Personne', // auth/me doesn't provide client type, default to Personne
    firstName: firstName || dto.first_name || dto.nom || '',
    lastName: rest.join(' ') || dto.last_name || '',
    phone: dto.telephone || '',
    email: dto.email,
    address: '', // auth/me doesn't provide address
    civilStatus: undefined, // auth/me doesn't provide civil status
    createdAt: dto.date_joined || new Date().toISOString(),
    // Additional fields from auth/me
    username: dto.username,
    role: dto.role,
  };
}

export function mapDossierDTO(dto: DossierDTO): Dossier {
  return {
    id: dto.id,
    number: dto.numero,
    type: dto.type_acte_libelle ?? dto.objet ?? 'Autre',
    responsibleId: '',
    status: dto.statut,
    createdAt: dto.created_at ?? dto.updated_at ?? new Date().toISOString(),
    updatedAt: dto.updated_at ?? new Date().toISOString(),
    clientStatus: dto.statut_display ?? dto.statut,
    progression: dto.completude_pieces ?? 0,
    clientAccessEnabled: true,
  };
}

export function mapDossierPartiesDTO(dto: DossierDTO): DossierParty[] {
  return (dto.parties ?? []).map((p) => ({
    id: p.id,
    dossierId: dto.id,
    clientId: '',
    role: (p.role as DossierParty['role']) ?? 'Mandataire',
  }));
}

export function mapConversationDTO(dto: ConversationDTO): Conversation {
  // Client portal now uses the same structure as admin
  return {
    id: dto.id,
    subject: dto.objet,
    status: dto.conversation_type,
    messageCount: dto.message_count,
    lastMessageAt: dto.last_message_at,
    createdAt: dto.created_at,
    dossierId: dto.dossier_id,
    dossierNumber: dto.dossier_number,
  };
}

export function mapConversationMessageDTO(dto: ConversationMessageDTO, conversationId: string, currentUserId?: string): ConversationMessage {
  // is_mine est calculé par le MessageSerializer (backend), donc fiable pour
  // l'admin ET le portail. La comparaison d'ID n'est gardée qu'en secours,
  // pour les payloads qui ne contiennent pas encore le flag.
  const isMine = dto.is_mine ?? Boolean(currentUserId && dto.sender === currentUserId);

  // Jamais de 'unknown' codé en dur : nom réel renvoyé par l'API (sender_name),
  // puis repli sur le rôle (sender_role), puis repli générique.
  const authorName = isMine ? 'Vous' : dto.sender_name || dto.sender_role || "L'étude";

  return {
    id: dto.id,
    conversationId: dto.conversation || conversationId,
    content: dto.content,
    isRead: true, // Backend doesn't provide read status in new structure
    createdAt: dto.created_at,
    authorId: dto.sender,
    authorName,
    authorRole: isMine ? 'current_user' : dto.sender_role,
    isMine,
  };
}

export function mapRendezVousDTO(dto: RendezVousDTO): Appointment {
  const dateTime = new Date(dto.date_heure);
  const date = dateTime.toISOString().split('T')[0];
  const time = dateTime.toTimeString().slice(0, 5);
  
  // Map backend status to frontend status
  const statusMap: Record<string, Appointment['status']> = {
    'planifie': 'planifie',
    'confirme': 'Confirmé',
    'propose': 'Proposé',
    'annule': 'Annulé',
    'reporte': 'Report demandé',
    'termine': 'Terminé',
  };
  
  return {
    id: dto.id,
    dossierId: dto.dossier ?? '',
    date,
    time,
    location: dto.lieu ?? '',
    purpose: dto.objet ?? '',
    status: statusMap[dto.statut ?? ''] ?? 'Proposé',
  };
}