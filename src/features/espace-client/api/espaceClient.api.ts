// Raw API layer — DTOs (shapes as confirmed by real sample payloads in
// deepseek_json_20260722_5f324d.json) + axios calls. See NOTES.md for
// what's confirmed vs. still guessed.
//
// Paths below OMIT the leading "/api" segment, since the sample file's
// base_url already includes it — verify this matches your shared axios
// instance's actual baseURL config.
//
// IMPORTANT: verify the import below matches your actual shared axios
// instance (shared/services/api.ts) — adjust if it's a default export
// or a differently-named export.
import { api } from '../../../shared/services/api';

export type PieceStatutDTO = 'manquante' | 'a_verifier' | 'validee' | 'rejetee';

export interface PieceDTO {
  id: string;
  dossier: string;
  dossier_numero?: string;
  type_piece?: string;
  nom: string;
  fichier?: string;
  statut: PieceStatutDTO;
  statut_display?: string;
  categorie?: string;
  categorie_display?: string;
  // Only confirmed on the non-portail /documents/ sample — unconfirmed
  // whether /portail/documents/ also returns this. Optional.
  commentaire?: string;
  created_at: string;
  updated_at?: string;
}

export interface SharedDocumentDTO {
  id: string;
  dossier: string;
  dossier_numero?: string;
  nom: string;
  fichier?: string;
  created_at: string;
  // Confirmé côté backend (dossiers/serializers.py, DocumentPartageSerializer) :
  // /portail/documents-partages/ renvoie bien `categorie` ("acte_signe") et
  // `categorie_display` ("Acte signé"). Gardés optionnels pour tolérer les
  // documents sans catégorie (blank) et les payloads plus anciens.
  categorie?: string;
  categorie_display?: string;
  type?: string;
}

/**
 * DTO du certificat d'intégrité.
 *
 * Charge utile réelle du backend (integrite/services.py, certificat_integrite) :
 *   { etude, genere_le, genere_par, document: {id, nom, type_piece,
 *     numero_dossier}, scelle, nb_blocs, hash_contenu, hash_bloc_dernier,
 *     hash_precedent_dernier, horodatage_scellement, cree_par,
 *     verification_document: {scelle, conforme, hash_fichier_actuel},
 *     verification_chaine: {statut_global, nb_blocs}, chaine_de_verification[] }
 * Endpoint client : GET /portail/integrite/document/{id}/certificat/
 * (scopé dossier__client=client_lie) — la route staff
 * /integrite/document/{id}/certificat/ est bloquée pour le rôle client.
 * Les alias optionnels (hash/empreinte, date_scellement, verifie/statut…) sont
 * résolus dans mapCertificatIntegriteDTO pour absorber d'éventuels vocabulaires
 * alternatifs.
 */
export interface CertificatIntegriteDTO {
  // --- Charge utile réelle ----------------------------------------------------
  etude?: string;
  genere_le?: string;
  genere_par?: { id?: string | null; nom?: string | null } | null;
  document?:
    | {
        id: string;
        nom: string;
        type_piece?: string;
        numero_dossier?: string;
      }
    | string;
  scelle?: boolean;
  nb_blocs?: number;
  hash_contenu?: string;
  hash_bloc_dernier?: string;
  hash_precedent_dernier?: string;
  horodatage_scellement?: string;
  cree_par?: { id?: string | null; nom?: string | null } | null;
  verification_document?: {
    scelle?: boolean;
    conforme?: boolean;
    hash_fichier_actuel?: string;
  };
  verification_chaine?: {
    statut_global?: string; // "valide" | "invalide"
    nb_blocs?: number;
  };
  chaine_de_verification?: Array<{
    id: string;
    horodatage: string;
    hash_bloc: string;
    hash_precedent: string;
  }>;

  // --- Alias tolérés (vocabulaires alternatifs) --------------------------------
  // Empreinte du document
  hash?: string;
  empreinte?: string;
  digest?: string;
  sha256?: string;
  // Horodatage du scellement / de la signature
  date_scellement?: string;
  scelle_le?: string;
  sealed_at?: string;
  horodatage?: string;
  // Contexte
  document_id?: string;
  document_nom?: string;
  nom_document?: string;
  client?: string;
  client_nom?: string;
  dossier?: string;
  dossier_numero?: string;
  // Confirmation d'intégrité
  verifie?: boolean;
  verified?: boolean;
  valide?: boolean;
  statut?: string;
  status?: string;
  created_at?: string;
}

export interface NotificationDTO {
  id: string;
  type?: string;
  title?: string;
  body?: string;
  link?: string;
  is_read?: boolean;
  created_at?: string;
  // Legacy fields for compatibility
  client?: string;
  client_id?: string;
  titre?: string;
  contenu?: string;
  content?: string;
  date_creation?: string;
  lu?: boolean;
  dossier?: string;
  dossier_id?: string;
}

export interface RendezVousDTO {
  id: string;
  dossier?: string;
  dossier_numero?: string;
  client?: string;
  client_nom?: string;
  organisateur?: string;
  organisateur_nom?: string;
  type_rdv?: string;
  statut?: string;
  date_heure: string;
  duree_minutes?: number;
  lieu?: string;
  objet?: string;
  notes?: string;
  rappel_envoye?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClientProfilDTO {
  id: string;
  username: string;
  email: string;
  nom?: string;
  first_name?: string;
  last_name?: string;
  telephone?: string;
  role: string;
  is_superuser?: boolean;
  doit_changer_mot_de_passe?: boolean;
  // Additional fields that might be present
  date_joined?: string;
  last_login?: string;
}

export interface DossierDTO {
  id: string;
  numero: string;
  objet?: string;
  type_acte_libelle?: string;
  statut: string;
  statut_display?: string;
  date_cible?: string;
  completude_pieces?: number;
  updated_at?: string;
  created_at?: string;
  parties?: { id: string; nom: string; role: string }[];
  taches?: { id: string; titre: string; statut: string; echeance?: string }[];
}

export interface ConversationDTO {
  id: string;
  objet: string;
  dossier_id: string;
  dossier_number: string;
  conversation_type: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
  participants: Array<{
    id: string;
    nom: string;
  }>;
  is_internal: boolean;
}

export interface ConversationMessageDTO {
  id: string;
  conversation: string;
  sender: string;
  sender_name: string;
  // Ajoutés côté backend (MessageSerializer UNIFIÉ) — identiques sur
  // l'endpoint admin (AdminMessageHistoryView) et client (ClientMessageHistoryView).
  sender_role?: string;
  is_mine?: boolean;
  content: string;
  created_at: string;
}

// DRF pagination wrapper — dossiers/ (non-portail) sample is paginated
// ({count,next,previous,results}); portail/* samples are all bare
// arrays. Handle both.
interface MaybePaginated<T> {
  results?: T[];
  count?: number;
}

function unwrap<T>(data: MaybePaginated<T> | T[]): T[] {
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}

export const espaceClientApi = {
  async getPieces(params?: { statut?: PieceStatutDTO; dossier?: string }): Promise<PieceDTO[]> {
    const { data } = await api.get('/portail/documents/', { params });
    return unwrap<PieceDTO>(data);
  },

  async uploadPiece(pieceId: string, payload: {
    dossier: string;
    type_piece: string;
    nom: string;
    fichier: File;
  }): Promise<PieceDTO> {
    const formData = new FormData();
    formData.append('dossier', payload.dossier);
    formData.append('type_piece', payload.type_piece);
    formData.append('nom', payload.nom);
    formData.append('fichier', payload.fichier);

    const { data } = await api.patch(`/portail/documents/${pieceId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getDocumentsPartages(): Promise<SharedDocumentDTO[]> {
    const { data } = await api.get('/portail/documents-partages/');
    return unwrap<SharedDocumentDTO>(data);
  },

  async getDocumentPartage(id: string): Promise<SharedDocumentDTO> {
    const { data } = await api.get(`/portail/documents-partages/${id}/`);
    return data;
  },

  // Endpoint PORTAL client : /api/portail/integrite/document/{id}/certificat/,
  // scopé sur dossier__client=client_lie. La route staff
  // /api/integrite/document/{id}/certificat/ est réservée au staff
  // (BlockClientRoleMixin) → elle renverrait 403 pour un compte client.
  async getIntegriteCertificat(documentId: string): Promise<CertificatIntegriteDTO> {
    const { data } = await api.get(`/portail/integrite/document/${documentId}/certificat/`);
    return data;
  },

  async visualiserDocumentPartage(id: string): Promise<Blob> {
    const { data } = await api.get(`/portail/documents-partages/${id}/visualiser`, {
      responseType: 'blob',
    });
    return data;
  },

  async telechargerDocumentPartage(id: string): Promise<Blob> {
    // Use visualiser endpoint for download as telecharger endpoint may not exist
    const { data } = await api.get(`/portail/documents-partages/${id}/visualiser`, {
      responseType: 'blob',
    });
    return data;
  },

  async getNotifications(): Promise<NotificationDTO[]> {
    const { data } = await api.get('/notifications/');
    return unwrap<NotificationDTO>(data);
  },

  async markNotificationRead(id: string): Promise<void> {
    await api.post(`/notifications/${id}/read/`);
  },

  async markAllNotificationsRead(): Promise<void> {
    await api.post('/notifications/read-all/');
  },

  async pushSubscribe(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<void> {
    await api.post('/notifications/push-subscribe/', subscription);
  },

  async getRendezVous(): Promise<RendezVousDTO[]> {
    const { data } = await api.get('/rendez-vous/');
    return unwrap<RendezVousDTO>(data);
  },

  async updateRendezVous(appointmentId: string, status: string): Promise<RendezVousDTO> {
    const { data } = await api.patch(`/rendez-vous/${appointmentId}/`, { statut: status });
    return data;
  },

  async getProfil(): Promise<ClientProfilDTO> {
    const { data } = await api.get('/auth/me/');
    return data;
  },

  async updateProfil(patch: Record<string, unknown>): Promise<ClientProfilDTO> {
    const { data } = await api.patch('/portail/profil/', patch);
    return data;
  },

  async changePassword(payload: { old_password: string; new_password: string }): Promise<void> {
    await api.post('/auth/change-password/', payload);
  },

  async getDossiers(): Promise<DossierDTO[]> {
    const { data } = await api.get('/portail/dossiers/');
    return unwrap<DossierDTO>(data);
  },

  async getDossier(id: string): Promise<DossierDTO> {
    const { data } = await api.get(`/portail/dossiers/${id}/`);
    return data;
  },

  async getConversations(): Promise<ConversationDTO[]> {
    const { data } = await api.get('/portail/messagerie/conversations/');
    return unwrap<ConversationDTO>(data);
  },

  async getConversation(conversationId: string): Promise<ConversationDTO> {
    const { data } = await api.get(`/portail/messagerie/conversations/${conversationId}/`);
    return data;
  },

  async createConversation(payload: {
    dossier: string;
  }): Promise<ConversationDTO> {
    const { data } = await api.post('/portail/messagerie/conversations/', payload);
    return data;
  },

  async getConversationMessages(conversationId: string): Promise<ConversationMessageDTO[]> {
    const { data } = await api.get(`/portail/messagerie/conversations/${conversationId}/messages/`);
    return unwrap<ConversationMessageDTO>(data);
  },

  async sendConversationMessage(conversationId: string, content: string): Promise<ConversationMessageDTO> {
    const { data } = await api.post(`/portail/messagerie/conversations/${conversationId}/messages/`, {
      content,
    });
    return data;
  },

  // Speculative — not present in the sample file at all (no
  // "paiements" section). Kept only as a placeholder for when it's
  // confirmed; not called anywhere yet.
  async getPaymentSituation(dossierId: string): Promise<unknown> {
    const { data } = await api.get(`/paiements/situation/${dossierId}/`);
    return data;
  },
};