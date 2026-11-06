import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Plus, User } from 'lucide-react';
import { adminMessagingService, mapConversationDTO, mapMessageDTO, type Conversation, type Message } from '../../../../shared/services/messaging.service';
import { useAuthStore } from '../../../auth/store/auth.store';
import { useToast } from '../../../../shared/components/ui/Toast/Toast';

interface MessagingTabProps {
  dossierId: string;
  clientName?: string;
  clientId?: string;
}

export const MessagingTab = ({ dossierId, clientName }: MessagingTabProps) => {
  const { user: currentUser } = useAuthStore();
  const toast = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const hasRemappedRef = useRef(false);

  // Load conversations for this dossier
  useEffect(() => {
    loadConversations();
  }, [dossierId]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Reload messages when user data becomes available (fixes race condition on initial load)
  useEffect(() => {
    if (currentUser?.id && selectedConversation && !hasRemappedRef.current) {
      adminMessagingService.getMessages(selectedConversation.id).then((data) => {
        const remappedMessages = data.map((msg) => mapMessageDTO(msg, currentUser.id));
        setMessages(remappedMessages);
        hasRemappedRef.current = true;
      });
    }
  }, [currentUser?.id, selectedConversation?.id]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const data = await adminMessagingService.getConversationsForDossier(dossierId);
      const mappedConversations = data.map(mapConversationDTO);
      setConversations(mappedConversations);
      
      // Auto-select the first conversation if available
      if (mappedConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(mappedConversations[0]);
      }
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      
      // Handle specific backend errors
      if (error.response?.status === 403) {
        toast.error("Vous n'avez pas accès à ce dossier.");
      } else {
        toast.error("Erreur lors du chargement des conversations.");
      }
      
      // Set empty array on error to prevent UI crashes
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const data = await adminMessagingService.getMessages(conversationId);
      // Always map with current user ID, even if it's null initially
      const mappedMessages = data.map((msg) => mapMessageDTO(msg, currentUser?.id));
      setMessages(mappedMessages);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      
      // Handle specific backend errors
      if (error.response?.status === 403) {
        toast.error("Vous n'avez pas accès à cette conversation.");
      } else {
        toast.error("Erreur lors du chargement des messages.");
      }
      
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const messageText = newMessage;
      setNewMessage('');
      
      await adminMessagingService.sendMessage(selectedConversation.id, messageText);
      await loadMessages(selectedConversation.id);
      await loadConversations(); // Refresh to update message count
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(newMessage); // Restore message on error
    }
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossierId) return;

    try {
      // Admin uses two-step process like client portal:
      // 1. Create conversation with dossier only
      // 2. Send message separately if provided
      const payload: any = {
        dossier: dossierId,
      };
      
      const newConv = await adminMessagingService.createConversation(payload);
      const mappedConv = mapConversationDTO(newConv);
      
      // Send first message if provided
      if (newMessageText.trim()) {
        try {
          await adminMessagingService.sendMessage(mappedConv.id, newMessageText);
        } catch (error) {
          console.error('Failed to send initial message:', error);
          // Don't fail the conversation creation if message fails
        }
      }
      
      setConversations([mappedConv, ...conversations]);
      setSelectedConversation(mappedConv);
      setIsCreatingConversation(false);
      setNewMessageText('');
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      
      // Handle specific backend errors
      if (error.response?.status === 403) {
        toast.error("Vous n'êtes pas responsable de ce dossier.");
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data?.dossier || error.response.data?.detail || "Erreur lors de la création";
        toast.error(errorMessage);
      } else {
        toast.error("Erreur lors de la création de la conversation.");
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ height: '600px' }}>
      <div className="grid grid-cols-1 lg:grid-cols-4 h-full">
        {/* Conversations List */}
        <div className="border-r border-slate-200 p-4 space-y-3 bg-slate-50/50 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Conversations</h4>
            <button
              onClick={() => setIsCreatingConversation(true)}
              className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              title="Nouvelle conversation"
            >
              <Plus size={14} />
            </button>
          </div>

          {loadingConversations ? (
            <p className="text-slate-400 text-xs text-center py-4">Chargement...</p>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">Aucune conversation pour ce dossier</p>
              <button
                onClick={() => setIsCreatingConversation(true)}
                className="mt-2 text-blue-600 text-xs hover:underline"
              >
                Créer une conversation
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border ${
                    selectedConversation?.id === conv.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs truncate">{conv.objet}</p>
                    {conv.dossierNumber && (
                      <p className={`text-[10px] mt-0.5 ${selectedConversation?.id === conv.id ? 'text-blue-100' : 'text-slate-400'}`}>
                        {conv.dossierNumber}
                      </p>
                    )}
                    {conv.nb_messages !== undefined && (
                      <p className={`text-[10px] mt-0.5 ${selectedConversation?.id === conv.id ? 'text-blue-100' : 'text-slate-400'}`}>
                        {conv.nb_messages} message{conv.nb_messages > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
          {isCreatingConversation ? (
            <form onSubmit={handleCreateConversation} className="flex-1 p-6 space-y-4 overflow-y-auto">
              <h4 className="font-bold text-slate-900 text-sm">Nouvelle conversation</h4>
              {clientName && (
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-800">
                    <User size={14} className="inline mr-1" />
                    Client: {clientName}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Premier message</label>
                <textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Votre message..."
                  rows={4}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-xl">
                  Créer et envoyer
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingConversation(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2 rounded-xl"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : !selectedConversation ? (
            <div className="flex-1 flex flex-col justify-center items-center p-12 text-center text-slate-400">
              <MessageSquare size={48} className="text-slate-200 mb-4" />
              <h4 className="font-bold text-slate-800 text-sm">Sélectionnez une conversation</h4>
              <p className="text-xs mt-2">Ou créez une nouvelle conversation pour commencer</p>
            </div>
          ) : (
            <>
              {/* Messages Header */}
              <div className="p-4 border-b border-slate-200 bg-white flex-shrink-0">
                <h3 className="font-bold text-slate-900 text-sm">{selectedConversation.objet}</h3>
                {selectedConversation.dossierNumber && (
                  <p className="text-xs text-slate-500 mt-1">Dossier: {selectedConversation.dossierNumber}</p>
                )}
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {loadingMessages ? (
                  <p className="text-xs text-slate-400 italic text-center">Chargement des messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-slate-400 py-12 italic text-xs">Aucun message pour l'instant.</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-md rounded-2xl p-4 shadow-sm ${
                          msg.isMine
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1 text-[10px]">
                          <span className={`font-bold ${msg.isMine ? 'text-blue-100' : 'text-blue-600'}`}>
                            {msg.isMine ? 'Vous' : (msg.authorName || clientName || 'Le client')}
                          </span>
                          <span className={msg.isMine ? 'text-blue-100' : 'text-slate-400'}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex gap-3 flex-shrink-0">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Votre message..."
                  className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                />
                <button type="submit" className="p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shrink-0">
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
