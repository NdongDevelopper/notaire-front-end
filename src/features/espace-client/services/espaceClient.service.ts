import type {
  Appointment,
  Conversation,
  ConversationMessage,
  Dossier,
  DossierParty,
  Payment,
  Piece,
  PortalNotification,
  SharedDocument,
} from '../types/client.types';
import { MOCK_PAYMENTS } from '../api/espaceClient.mock';
import { espaceClientApi } from '../api/espaceClient.api';
import {
  mapConversationDTO,
  mapConversationMessageDTO,
  mapDossierDTO,
  mapDossierPartiesDTO,
  mapNotificationDTO,
  mapPieceDTO,
  mapRendezVousDTO,
  mapSharedDocumentDTO,
} from '../api/espaceClient.mapper';
import { clientMessagingService } from '../../../shared/services/messaging.service';

// See NOTES.md. Wired for real: dossiers, parties (from dossier
// detail), pieces, piece upload, sharedDocuments, notifications,
// conversations + messages, rendez-vous. Client profile now comes from the auth
// store (see EspaceClientDataContext), not a separate API call — the
// dedicated /api/portail/profil/ endpoint 404s on the deployed backend.
// Still mock: payments (no endpoint exists in the confirmed sample file at all).

const MOCK_DELAY_MS = 150;
function resolveAfter<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const espaceClientService = {
  // getCurrentClient removed — /api/portail/profil/ 404s on the deployed
  // backend, and the authenticated AuthUser (already loaded by
  // ProtectedRoute/restoreSession before this feature mounts) has
  // everything currently available. See
  // EspaceClientDataContext.tsx + mapAuthUserToClient.

  async getMyDossiers(): Promise<Dossier[]> {
    const dtos = await espaceClientApi.getDossiers();
    return dtos.map(mapDossierDTO);
  },

  // Replaces the old getMyParties(), which fetched every dossier's full
  // detail on every page load (N+1) just to get party/role data —
  // meaningfully slow on a resource-constrained backend since it ran
  // on every single route, not just dossier detail. Now fetched lazily,
  // one dossier at a time, only by ClientPortalDossierDetail.
  async getPartiesForDossier(dossierId: string): Promise<DossierParty[]> {
    const dto = await espaceClientApi.getDossier(dossierId);
    return mapDossierPartiesDTO(dto);
  },

  async getDossier(dossierId: string): Promise<any> {
    return await espaceClientApi.getDossier(dossierId);
  },

  async getMyPieces(): Promise<Piece[]> {
    const dtos = await espaceClientApi.getPieces();
    return dtos.map(mapPieceDTO);
  },

  async getMySharedDocuments(): Promise<SharedDocument[]> {
    const dtos = await espaceClientApi.getDocumentsPartages();
    return dtos.map(mapSharedDocumentDTO);
  },

  async getSharedDocument(id: string): Promise<SharedDocument> {
    const dto = await espaceClientApi.getDocumentPartage(id);
    return mapSharedDocumentDTO(dto);
  },

  async visualiserSharedDocument(id: string): Promise<Blob> {
    return espaceClientApi.visualiserDocumentPartage(id);
  },

  async telechargerSharedDocument(id: string): Promise<Blob> {
    return espaceClientApi.telechargerDocumentPartage(id);
  },

  async getMyAppointments(): Promise<Appointment[]> {
    const dtos = await espaceClientApi.getRendezVous();
    return dtos.map(mapRendezVousDTO);
  },

  getMyPayments(): Promise<Payment[]> {
    // TODO: no endpoint exists in the confirmed sample file.
    return resolveAfter(MOCK_PAYMENTS);
  },

  async getMyNotifications(): Promise<PortalNotification[]> {
    const dtos = await espaceClientApi.getNotifications();
    return dtos.map(mapNotificationDTO);
  },

  async getMyConversations(): Promise<Conversation[]> {
    const dtos = await clientMessagingService.getConversations();
    return dtos.map(mapConversationDTO);
  },

  async getConversation(conversationId: string): Promise<Conversation> {
    const dto = await clientMessagingService.getConversation(conversationId);
    return mapConversationDTO(dto);
  },

  async getConversationMessages(conversationId: string, currentUserId?: string): Promise<ConversationMessage[]> {
    const dtos = await clientMessagingService.getMessages(conversationId);
    return dtos.map((dto) => mapConversationMessageDTO(dto, conversationId, currentUserId));
  },

  // --- Mutations ---

  async uploadPiece(pieceId: string, dossierId: string, typePiece: string, fileName: string, file: File): Promise<Piece> {
    const dto = await espaceClientApi.uploadPiece(pieceId, {
      dossier: dossierId,
      type_piece: typePiece,
      nom: fileName,
      fichier: file,
    });
    return mapPieceDTO(dto);
  },

  async createConversation(_subject: string, message: string, dossierId?: string): Promise<Conversation> {
    // Client portal uses two-step process:
    // 1. Create conversation with dossier only
    // 2. Send message separately if provided
    
    if (!dossierId) {
      throw new Error('Dossier ID is required for creating a conversation');
    }
    
    // Step 1: Create conversation
    const conversation = await clientMessagingService.createConversation({ dossier: dossierId });
    const mappedConversation = mapConversationDTO(conversation);
    
    // Step 2: Send first message if provided
    if (message && message.trim()) {
      try {
        await clientMessagingService.sendMessage(mappedConversation.id, message);
      } catch (error) {
        console.error('Failed to send initial message:', error);
        // Don't fail the conversation creation if message fails
      }
    }
    
    // Note: subject is not used in the new API structure
    // The conversation subject is automatically generated by the backend
    
    return mappedConversation;
  },

  async sendConversationMessage(conversationId: string, content: string): Promise<ConversationMessage> {
    const dto = await clientMessagingService.sendMessage(conversationId, content);
    return mapConversationMessageDTO(dto, conversationId);
  },

  async updateAppointment(appointmentId: string, status: Appointment['status']): Promise<void> {
    // Map frontend status to backend status
    const statusMap: Record<Appointment['status'], string> = {
      'planifie': 'planifie',
      'Proposé': 'propose',
      'Confirmé': 'confirme',
      'Report demandé': 'reporte',
      'Annulé': 'annule',
      'Terminé': 'termine',
    };

    const backendStatus = statusMap[status];
    if (!backendStatus) return;

    await espaceClientApi.updateRendezVous(appointmentId, backendStatus);
  },

  async requestProfileChange(field: string, value: string): Promise<void> {
    // Map frontend field names to API field names
    const patchKeyMap: Record<string, string> = {
      Téléphone: 'telephone',
      'E-mail': 'email',
      Adresse: 'nom', // Since address field doesn't exist in auth/me, use nom for demo
    };
    const key = patchKeyMap[field];
    if (!key) return;
    await espaceClientApi.updateProfil({ [key]: value });
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await espaceClientApi.changePassword({ old_password: oldPassword, new_password: newPassword });
  },

  async markNotificationsRead(notificationId: string): Promise<void> {
    await espaceClientApi.markNotificationRead(notificationId);
  },

  async pushSubscribe(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<void> {
    await espaceClientApi.pushSubscribe(subscription);
  },
};