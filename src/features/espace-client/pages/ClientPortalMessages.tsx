import { useEffect, useState, useRef } from 'react';
import { ChevronRight, MessageSquare, Plus, Send, WifiOff } from 'lucide-react';
import { PortalPageHeader } from '../components/PortalPageHeader';
import { useEspaceClientData } from '../context/EspaceClientDataContext';
import { useAuthStore } from '../../auth/store/auth.store';
import { useOfflineStore } from '../../../shared/store/offline.store';
import { useToast } from '../../../shared/components/ui/Toast/Toast';
import { isOfflineQueuedError } from '../../../shared/utils/offline/offlineQueue';
import type { ConversationMessage } from '../types/client.types';

/** Message envoyé hors ligne : affiché en bulle « En attente d'envoi » tant
 *  que la file n'est pas vidée, puis retiré lors de la re-synchronisation. */
interface PendingMessage {
  id: string;
  content: string;
  createdAt: string;
}

export function ClientPortalMessages() {
  const { user: currentUser } = useAuthStore();
  const toast = useToast();
  const { isOnline, queueCount } = useOfflineStore();
  const {
    isLoading,
    myConversations,
    unreadNotificationsCount,
    getConversationMessages,
    sendConversationMessage,
    createConversation,
    getConversation,
    myDossiers,
  } = useEspaceClientData();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newBody, setNewBody] = useState('');
  const [newDossierId, setNewDossierId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  // Messages envoyés hors ligne (mis en file par l'intercepteur).
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const hasRemappedRef = useRef(false);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingMessages(true);
    getConversationMessages(selectedId)
      .then(setMessages)
      .finally(() => setLoadingMessages(false));
  }, [selectedId, getConversationMessages]);

  useEffect(() => {
    if (selectedId) {
      getConversation(selectedId).then(setSelectedConversation);
    }
  }, [selectedId, getConversation]);

  // Reload messages when user data becomes available (fixes race condition on initial load)
  useEffect(() => {
    if (currentUser?.id && selectedId && !hasRemappedRef.current) {
      // Force reload messages when user data becomes available to ensure proper isMine flags
      getConversationMessages(selectedId).then(setMessages);
      hasRemappedRef.current = true;
    }
  }, [currentUser?.id, selectedId]);

  // Re-synchro : dès que la file d'attente est vidée (actions parties),
  // on recharge le fil pour remplacer les bulles « En attente d'envoi »
  // par les vrais messages serveur.
  useEffect(() => {
    if (!isOnline || queueCount > 0) return;
    if (pendingMessages.length === 0) return;

    setPendingMessages([]);
    if (selectedId) {
      getConversationMessages(selectedId)
        .then(setMessages)
        .catch(() => undefined);
    }
  }, [isOnline, queueCount, pendingMessages.length, selectedId, getConversationMessages]);

  if (isLoading) {
    return <div className="p-4 sm:p-6 lg:p-8 text-sm text-slate-500">Chargement de la messagerie...</div>;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !newMessageText.trim() || isSending) return;
    const text = newMessageText;
    setNewMessageText('');
    setIsSending(true);
    try {
      await sendConversationMessage(selectedId, text);
      if (isOnline && queueCount === 0) {
        const updated = await getConversationMessages(selectedId);
        setMessages(updated);
      } else {
        // En ligne mais file non vidée : on rafraîchira au prochain
        // « queueCount === 0 » (voir effect de re-synchro).
        toast.info("Message enregistré — en cours d'envoi automatique.");
      }
    } catch (error) {
      // Hors ligne : l'intercepteur a mis le message en file d'attente
      // (feedback client #2) — on l'affiche en bulle « En attente d'envoi ».
      if (isOfflineQueuedError(error)) {
        setPendingMessages((prev) => [
          ...prev,
          {
            id: `pending-${crypto.randomUUID()}`,
            content: text,
            createdAt: new Date().toISOString(),
          },
        ]);
        toast.info('Message enregistré — il sera envoyé dès le retour de la connexion.');
      } else {
        toast.error("L'envoi du message a échoué. Veuillez réessayer.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBody.trim() || isCreating) return;
    // Créer une conversation requiert une vraie réponse du serveur (id de
    // conversation) : inutile de la tenter hors ligne.
    if (!isOnline) {
      toast.warning("Impossible de créer une conversation hors ligne. Reconnectez-vous puis réessayez.");
      return;
    }
    setIsCreating(true);
    try {
      const conv = await createConversation('', newBody, newDossierId || undefined);
      setIsNewOpen(false);
      setNewBody('');
      setNewDossierId('');
      setSelectedId(conv.id);
    } catch (error) {
      if (!isOfflineQueuedError(error)) {
        toast.error("La création de la conversation a échoué. Veuillez réessayer.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PortalPageHeader
        title="Mes messages"
        subtitle="Échangez directement avec l'étude au sujet de vos dossiers."
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: '600px' }}>
        <div className="border-r border-slate-100 p-4 space-y-3 bg-slate-50/50 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Conversations</h4>
            <button
              onClick={() => setIsNewOpen(true)}
              className="p-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400"
              title="Nouvelle conversation"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-1.5">
            {myConversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border ${
                  selectedId === c.id
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200/60'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs truncate">{c.subject}</p>
                  {c.dossierNumber && (
                    <p className={`text-xs mt-0.5 ${selectedId === c.id ? 'text-amber-100' : 'text-slate-500'}`}>
                      {c.dossierNumber}
                    </p>
                  )}
                  {c.messageCount !== undefined && (
                    <p className={`text-xs mt-0.5 ${selectedId === c.id ? 'text-amber-100' : 'text-slate-500'}`}>
                      {c.messageCount} message{c.messageCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <ChevronRight size={14} className="shrink-0" />
              </button>
            ))}

            {myConversations.length === 0 && (
              <p className="text-slate-500 text-xs italic text-center py-6">Aucune conversation. Créez-en une.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
          {isNewOpen ? (
              <form onSubmit={handleCreateConversation} className="flex-1 p-6 space-y-4 overflow-y-auto">
                <h4 className="font-bold text-slate-900 text-sm">Nouvelle conversation</h4>
                {!isOnline && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-bold text-amber-800">
                    <WifiOff size={14} />
                    Vous êtes hors ligne : la création de conversation est indisponible jusqu'au retour de la connexion.
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Dossier concerné</label>
                  <select
                    value={newDossierId}
                    onChange={(e) => setNewDossierId(e.target.value)}
                    disabled={isCreating}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">Aucun dossier (optionnel)</option>
                    {myDossiers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.number} - {d.type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Premier message</label>
                  <textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    placeholder="Votre message..."
                    rows={4}
                    disabled={isCreating}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={isCreating || !isOnline} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-4 py-2 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-amber-500 transition-all">
                    {isCreating ? 'Création...' : 'Créer et envoyer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewOpen(false)}
                    disabled={isCreating}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-slate-100 transition-all"
                  >
                    Annuler
                  </button>
                </div>
              </form>
          ) : !selectedId ? (
            <div className="flex-1 flex flex-col justify-center items-center p-12 text-center text-slate-500">
              <MessageSquare size={48} className="text-slate-200 mb-4" />
              <h4 className="font-bold text-slate-800 text-sm">Sélectionnez une conversation</h4>
              <p className="text-xs mt-2">Ou créez une nouvelle conversation pour commencer</p>
            </div>
          ) : (
            <>
              {/* Messages Header */}
              <div className="p-4 border-b border-slate-200 bg-white flex-shrink-0">
                <h3 className="font-bold text-slate-900 text-sm">{selectedConversation?.subject || myConversations.find(c => c.id === selectedId)?.subject}</h3>
                {selectedConversation?.dossierNumber && (
                  <p className="text-xs text-slate-500 mt-1">Dossier: {selectedConversation.dossierNumber}</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {loadingMessages && <p className="text-xs text-slate-500 italic">Chargement...</p>}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-md rounded-2xl p-4 shadow-sm ${
                        msg.isMine
                          ? 'bg-amber-500 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 text-xs">
                        <span className={`font-bold ${msg.isMine ? 'text-amber-100' : 'text-amber-600'}`}>
                          {msg.authorName || (msg.isMine ? 'Vous' : msg.authorRole || "L'étude")}
                          {!msg.isMine && msg.authorRole && msg.authorRole !== 'current_user' && (
                            <span className="font-medium opacity-80"> · {msg.authorRole}</span>
                          )}
                        </span>
                        <span className={msg.isMine ? 'text-amber-100' : 'text-slate-500'}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {/* Bulles « En attente d'envoi » (feedback client #2) */}
                {pendingMessages.map((pm) => (
                  <div key={pm.id} className="flex justify-end">
                    <div className="max-w-md rounded-2xl p-4 rounded-tr-none bg-orange-50 border border-orange-200 text-slate-800 shadow-sm">
                      <div className="flex items-center justify-between gap-4 mb-1 text-xs">
                        <span className="font-bold text-orange-700">Vous</span>
                        <span className="text-slate-500">
                          {new Date(pm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-line leading-relaxed">{pm.content}</p>
                      <p className="flex items-center gap-1 text-[11px] font-bold text-orange-700 mt-2">
                        <WifiOff size={12} /> En attente d'envoi
                      </p>
                    </div>
                  </div>
                ))}

                {!loadingMessages && messages.length === 0 && pendingMessages.length === 0 && (
                  <p className="text-center text-slate-500 py-12 italic text-xs">Aucun message pour l'instant.</p>
                )}
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex gap-3 flex-shrink-0">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Votre message..."
                  disabled={isSending}
                  className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button type="submit" disabled={isSending} className="p-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shrink-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-amber-500 transition-all">
                  {isSending ? 'Envoi...' : <Send size={18} />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientPortalMessages;