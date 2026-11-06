import { api } from './api';

// Shared messaging types
export interface Message {
  id: string;
  conversation: string;
  sender: string;
  sender_name: string;
  // Ajoutés côté backend (MessageSerializer UNIFIÉ) — présents sur les
  // endpoints admin ET client.
  sender_role?: string;
  is_mine?: boolean;
  content: string;
  created_at: string;
  // For compatibility with existing types
  auteur?: {
    id: string;
    nom: string;
    role?: string;
  };
  authorId?: string;
  authorName?: string;
  authorRole?: string;
  isMine?: boolean;
}

export interface Conversation {
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
  // For compatibility with existing types
  subject?: string;
  statut?: string;
  nb_messages?: number;
  dernier_message?: string;
  dossier?: {
    id: string;
    numero: string;
  } | string | null;
  messageCount?: number;
  lastMessageAt?: string;
  dossierId?: string;
  dossierNumber?: string;
}

export interface CreateConversationPayload {
  dossier: string;
}

// Admin messaging endpoints
export const adminMessagingService = {
  async getConversations(): Promise<Conversation[]> {
    const { data } = await api.get('/messagerie/conversations/');
    return Array.isArray(data) ? data : (data as any).results || [];
  },

  async getConversation(conversationId: string): Promise<Conversation> {
    const { data } = await api.get(`/messagerie/conversations/${conversationId}/`);
    return data;
  },

  async createConversation(payload: CreateConversationPayload): Promise<Conversation> {
    // Admin uses two-step process like client portal:
    // 1. Create conversation with dossier only
    // 2. Send message separately if needed
    const { data } = await api.post('/messagerie/conversations/', {
      dossier: payload.dossier
    });
    return data;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data } = await api.get(`/messagerie/conversations/${conversationId}/messages/`);
    return Array.isArray(data) ? data : (data as any).results || [];
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const { data } = await api.post(`/messagerie/conversations/${conversationId}/messages/`, { content });
    return data;
  },

  async getConversationsForDossier(dossierId: string): Promise<Conversation[]> {
    // Backend now properly filters by dossier
    const { data } = await api.get('/messagerie/conversations/', { 
      params: { dossier: dossierId } 
    });
    return Array.isArray(data) ? data : (data as any).results || [];
  },
};

// Client messaging endpoints (portail)
export const clientMessagingService = {
  async getConversations(): Promise<Conversation[]> {
    const { data } = await api.get('/portail/messagerie/conversations/');
    return Array.isArray(data) ? data : (data as any).results || [];
  },

  async getConversation(conversationId: string): Promise<Conversation> {
    const { data } = await api.get(`/portail/messagerie/conversations/${conversationId}/`);
    return data;
  },

  async createConversation(payload: CreateConversationPayload): Promise<Conversation> {
    // Client portal uses two-step process:
    // 1. Create conversation with dossier only
    // 2. Send message separately if needed
    const { data } = await api.post('/portail/messagerie/conversations/', {
      dossier: payload.dossier
    });
    return data;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data } = await api.get(`/portail/messagerie/conversations/${conversationId}/messages/`);
    return Array.isArray(data) ? data : (data as any).results || [];
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const { data } = await api.post(`/portail/messagerie/conversations/${conversationId}/messages/`, { content });
    return data;
  },

  async getConversationsForDossier(dossierId: string): Promise<Conversation[]> {
    // Backend now properly filters by dossier
    const { data } = await api.get('/portail/messagerie/conversations/', { 
      params: { dossier: dossierId } 
    });
    return Array.isArray(data) ? data : (data as any).results || [];
  },
};

// Mapping functions to convert between API formats and UI formats
export function mapConversationDTO(conversation: any): Conversation {
  // Both admin and client portal now use the same new structure
  return {
    id: conversation.id,
    objet: conversation.objet,
    dossier_id: conversation.dossier_id,
    dossier_number: conversation.dossier_number,
    conversation_type: conversation.conversation_type,
    message_count: conversation.message_count,
    last_message_at: conversation.last_message_at,
    created_at: conversation.created_at,
    participants: conversation.participants || [],
    is_internal: conversation.is_internal || false,
    // Compatibility fields for existing UI components
    subject: conversation.objet,
    statut: conversation.conversation_type,
    nb_messages: conversation.message_count,
    dernier_message: conversation.last_message_at,
    dossier: {
      id: conversation.dossier_id,
      numero: conversation.dossier_number
    },
    messageCount: conversation.message_count,
    lastMessageAt: conversation.last_message_at,
    dossierId: conversation.dossier_id,
    dossierNumber: conversation.dossier_number,
  };
}

export function mapMessageDTO(message: any, currentUserId?: string): Message {
  // is_mine est calculé par le MessageSerializer (backend), fiable pour
  // l'admin ET le portail. La comparaison d'ID n'est gardée qu'en secours,
  // pour les payloads qui ne contiennent pas encore le flag.
  const isMine = Boolean(
    message.is_mine ?? (currentUserId && message.sender === currentUserId),
  );

  // Jamais de 'unknown' codé en dur : nom réel renvoyé par l'API (sender_name),
  // puis repli sur le rôle (sender_role), puis repli générique.
  const authorName = isMine ? 'Vous' : message.sender_name || message.sender_role || "L'étude";

  return {
    id: message.id,
    conversation: message.conversation,
    sender: message.sender,
    sender_name: message.sender_name,
    sender_role: message.sender_role,
    is_mine: message.is_mine,
    content: message.content,
    created_at: message.created_at,
    // Compatibility fields
    auteur: {
      id: message.sender,
      nom: authorName,
      role: isMine ? 'current_user' : message.sender_role,
    },
    authorId: message.sender,
    authorName,
    authorRole: isMine ? 'current_user' : message.sender_role,
    isMine,
  };
}
