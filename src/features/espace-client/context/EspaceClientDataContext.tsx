import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  Appointment,
  Client,
  Conversation,
  ConversationMessage,
  Dossier,
  DossierParty,
  Payment,
  Piece,
  PortalNotification,
  SharedDocument,
} from '../types/client.types';
import { espaceClientService } from '../services/espaceClient.service';
import { useAuthStore } from '../../auth/store/auth.store';
import { mapAuthUserToClient, mapClientProfilDTO } from '../api/espaceClient.mapper';
import { espaceClientApi } from '../api/espaceClient.api';
import { loadPortalData, savePortalData } from '../services/portalDataCache';
import { isOfflineQueuedError } from '../../../shared/utils/offline/offlineQueue';
import { useOfflineStore } from '../../../shared/store/offline.store';
import { useToast } from '../../../shared/components/ui/Toast/Toast';

interface EspaceClientData {
  isLoading: boolean;
  hasError: boolean;
  client: Client | null;
  /** Date ISO de la dernière synchronisation réussie (cache local ou serveur). */
  lastSyncAt: string | null;

  myDossiers: Dossier[];
  myPieces: Piece[];
  myDocs: SharedDocument[];
  myAppointments: Appointment[];
  myPayments: Payment[];
  myNotifications: PortalNotification[];
  myConversations: Conversation[];

  unreadNotificationsCount: number;
  nextAppointment: Appointment | undefined;
  pendingPayment: Payment | undefined;

  uploadPiece: (pieceId: string, dossierId: string, typePiece: string, file: File) => Promise<void>;
  getPartiesForDossier: (dossierId: string) => Promise<DossierParty[]>;
  getDossier: (dossierId: string) => Promise<any>;
  updateAppointment: (appointmentId: string, status: Appointment['status']) => Promise<void>;
  requestProfileChange: (field: string, value: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  markNotificationsRead: (notificationId: string) => Promise<void>;
  pushSubscribe: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) => Promise<void>;

  // Shared Documents
  getSharedDocument: (id: string) => Promise<SharedDocument>;
  visualiserSharedDocument: (id: string) => Promise<Blob>;
  telechargerSharedDocument: (id: string) => Promise<Blob>;

  // Conversations
  getConversationMessages: (conversationId: string) => Promise<ConversationMessage[]>;
  sendConversationMessage: (conversationId: string, content: string) => Promise<void>;
  createConversation: (subject: string, message: string, dossierId?: string) => Promise<Conversation>;
  getConversation: (conversationId: string) => Promise<Conversation>;

  refetch: () => void;
}

const EspaceClientDataContext = createContext<EspaceClientData | null>(null);

export function EspaceClientDataProvider({ children }: { children: ReactNode }) {
  const authUser = useAuthStore((state) => state.user);
  const [client, setClient] = useState<Client | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [docs, setDocs] = useState<SharedDocument[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refetchToken, setRefetchToken] = useState(0);

  const toast = useToast();

  /**
   * Chargement des données du portail.
   *
   * Mode hors ligne (feedback client #2) : on hydrate d'abord depuis le
   * cache local (portalDataCache) pour ne PAS afficher d'écran de
   * chargement quand on a déjà consulté la page ; chaque collection garde
   * ensuite sa valeur en cache lorsque sa requête échoue, au lieu de
   * basculer sur une liste vide. `hasError` ne passe à true que si une
   * requête échoue SANS cache de repli disponible.
   */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cached = loadPortalData(authUser?.id ?? null);

      // Hydration depuis le cache : pas d'écran de chargement, dernière
      // date de synchro affichée par la bannière hors ligne.
      if (cached && !cancelled) {
        setClient(cached.snapshot.client);
        setDossiers(cached.snapshot.dossiers);
        setPieces(cached.snapshot.pieces);
        setDocs(cached.snapshot.docs);
        setAppointments(cached.snapshot.appointments);
        setPayments(cached.snapshot.payments);
        setNotifications(cached.snapshot.notifications);
        setConversations(cached.snapshot.conversations);
        setLastSyncAt(cached.syncedAt);
        setIsLoading(false);
      } else if (!cancelled) {
        setIsLoading(true);
      }

      const results = await Promise.allSettled([
        espaceClientApi.getProfil(),
        espaceClientService.getMyDossiers(),
        espaceClientService.getMyPieces(),
        espaceClientService.getMySharedDocuments(),
        espaceClientService.getMyAppointments(),
        espaceClientService.getMyPayments(),
        espaceClientService.getMyNotifications(),
        espaceClientService.getMyConversations(),
      ]);

      if (cancelled) return;

      const [
        profileResult,
        dossiersResult,
        piecesResult,
        docsResult,
        appointmentsResult,
        paymentsResult,
        notificationsResult,
        conversationsResult,
      ] = results;

      // hasError = un échec ET aucun cache pour faire le repli. Seule la
      // page Documents consomme hasError (écran « Erreur de chargement ») ;
      // hors ligne avec cache, on reste sur les données en cache.
      const anyRejected = results.some((r) => r.status === 'rejected');
      if (anyRejected && !cached) setHasError(true);

      // Set client from profile API, fall back to auth user if profile fails
      if (profileResult.status === 'fulfilled') {
        setClient(mapClientProfilDTO(profileResult.value));
      } else if (authUser) {
        setClient(mapAuthUserToClient(authUser));
      }

      // Per-collection : valeur fraîche si OK, sinon on GARDE l'état en
      // cache (repli hors ligne / serveur partiellement indisponible).
      setDossiers(dossiersResult.status === 'fulfilled' ? dossiersResult.value : cached?.snapshot.dossiers ?? dossiers);
      setPieces(piecesResult.status === 'fulfilled' ? piecesResult.value : cached?.snapshot.pieces ?? pieces);
      setDocs(docsResult.status === 'fulfilled' ? docsResult.value : cached?.snapshot.docs ?? docs);
      setAppointments(appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : cached?.snapshot.appointments ?? appointments);
      setPayments(paymentsResult.status === 'fulfilled' ? paymentsResult.value : cached?.snapshot.payments ?? payments);
      setNotifications(notificationsResult.status === 'fulfilled' ? notificationsResult.value : cached?.snapshot.notifications ?? notifications);
      setConversations(conversationsResult.status === 'fulfilled' ? conversationsResult.value : cached?.snapshot.conversations ?? conversations);

      setIsLoading(false);

      // Snapshot + date de synchro uniquement quand au moins une SOURCE
      // RÉELLE (non-mock) a répondu. Les paiements sont un mock local
      // (resolveAfter) qui « réussit » toujours : on les exclut du test
      // pour ne pas marquer une synchro réussie quand tout a échoué.
      const realSucceeded = [
        profileResult,
        dossiersResult,
        piecesResult,
        docsResult,
        appointmentsResult,
        notificationsResult,
        conversationsResult,
      ].some((r) => r.status === 'fulfilled');

      if (realSucceeded) {
        const syncedAt = savePortalData({
          ownerId: authUser?.id ?? null,
          client:
            profileResult.status === 'fulfilled'
              ? mapClientProfilDTO(profileResult.value)
              : authUser
                ? mapAuthUserToClient(authUser)
                : client,
          dossiers: dossiersResult.status === 'fulfilled' ? dossiersResult.value : dossiers,
          pieces: piecesResult.status === 'fulfilled' ? piecesResult.value : pieces,
          docs: docsResult.status === 'fulfilled' ? docsResult.value : docs,
          appointments: appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : appointments,
          payments: paymentsResult.status === 'fulfilled' ? paymentsResult.value : payments,
          notifications: notificationsResult.status === 'fulfilled' ? notificationsResult.value : notifications,
          conversations: conversationsResult.status === 'fulfilled' ? conversationsResult.value : conversations,
        });
        if (!cancelled) setLastSyncAt(syncedAt);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refetchToken, authUser]);

  /**
   * Re-synchronisation automatique (feedback client #2) : dès que la file
   * d'attente passe de >0 à 0 (actions « en attente d'envoi » parties) ou
   * qu'on repasse en ligne, on rafraîchit les données pour ramener le vrai
   * état serveur (ex: pièce passée de « En attente d'envoi » à « En
   * vérification »).
   */
  const { isOnline, queueCount } = useOfflineStore();
  const prevQueueState = useRef<{ online: boolean; count: number }>({ online: isOnline, count: queueCount });

  useEffect(() => {
    const prev = prevQueueState.current;
    const wentOnline = !prev.online && isOnline;
    const queueDrained = prev.count > 0 && queueCount === 0;
    prevQueueState.current = { online: isOnline, count: queueCount };

    if (wentOnline || queueDrained) {
      setRefetchToken((t) => t + 1);
    }
  }, [isOnline, queueCount]);

  const myDossiers = dossiers;
  const myPieces = pieces;
  const myDocs = docs;
  const myAppointments = appointments;
  const myPayments = payments;
  const myNotifications = notifications;
  const myConversations = conversations;

  const unreadNotificationsCount = useMemo(
    () => myNotifications.filter((n) => !n.isRead).length,
    [myNotifications],
  );
  const nextAppointment = useMemo(
    () =>
      myAppointments
        .filter((a) => a.status === 'Confirmé' || a.status === 'Proposé')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0],
    [myAppointments],
  );
  const pendingPayment = useMemo(() => myPayments.find((p) => p.isRequested && !p.isPaid), [myPayments]);

  const refetch = useCallback(() => setRefetchToken((t) => t + 1), []);

  const getPartiesForDossier = useCallback<EspaceClientData['getPartiesForDossier']>(
    (dossierId) => espaceClientService.getPartiesForDossier(dossierId),
    [],
  );

  const getDossier = useCallback<EspaceClientData['getDossier']>(
    (dossierId) => espaceClientService.getDossier(dossierId),
    [],
  );

  const uploadPiece = useCallback<EspaceClientData['uploadPiece']>(async (pieceId, dossierId, typePiece, file) => {
    try {
      const updated = await espaceClientService.uploadPiece(pieceId, dossierId, typePiece, file.name, file);
      setPieces((prev) => {
        const exists = prev.some((p) => p.id === updated.id);
        return exists ? prev.map((p) => (p.id === updated.id ? updated : p)) : [...prev, updated];
      });
    } catch (error) {
      // Hors ligne : la requête a été mise en file d'attente (feedback
      // client #2) — on affiche « En attente d'envoi » localement au lieu
      // d'une erreur. La re-synchro automatique (effect ci-dessus) ramènera
      // le vrai statut serveur une fois la file vidée.
      if (isOfflineQueuedError(error)) {
        setPieces((prev) =>
          prev.map((p) =>
            p.id === pieceId
              ? { ...p, clientStatus: "En attente d'envoi", pendingSync: true, uploadedAt: new Date().toISOString() }
              : p,
          ),
        );
        // Assure un repli si la pièce n'existe pas encore localement.
        if (!pieces.some((p) => p.id === pieceId)) {
          setPieces((prev) => [
            ...prev,
            {
              id: pieceId,
              dossierId,
              name: file.name,
              status: 'Manquante',
              clientStatus: "En attente d'envoi",
              pendingSync: true,
              typePiece,
              uploadedAt: new Date().toISOString(),
              source: 'client',
            },
          ]);
        }
        toast.info(
          "Pièce enregistrée sur votre appareil — elle sera envoyée automatiquement dès le retour de la connexion.",
          5000,
        );
        return;
      }
      throw error;
    }
  }, [toast, pieces]);

  const updateAppointment = useCallback<EspaceClientData['updateAppointment']>(async (appointmentId, status) => {
    await espaceClientService.updateAppointment(appointmentId, status);
    setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status } : a)));
  }, []);

  const requestProfileChange = useCallback<EspaceClientData['requestProfileChange']>(async (field, value) => {
    await espaceClientService.requestProfileChange(field, value);
  }, []);

  const changePassword = useCallback<EspaceClientData['changePassword']>(async (oldPassword, newPassword) => {
    await espaceClientService.changePassword(oldPassword, newPassword);
  }, []);

  const markNotificationsRead = useCallback<EspaceClientData['markNotificationsRead']>(async (notificationId) => {
    await espaceClientService.markNotificationsRead(notificationId);
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
  }, []);

  const pushSubscribe = useCallback<EspaceClientData['pushSubscribe']>(
    async (subscription) => {
      await espaceClientService.pushSubscribe(subscription);
    },
    [],
  );

  const getConversationMessages = useCallback<EspaceClientData['getConversationMessages']>(
    (conversationId) => espaceClientService.getConversationMessages(conversationId, authUser?.id),
    [authUser?.id],
  );

  const sendConversationMessage = useCallback<EspaceClientData['sendConversationMessage']>(
    async (conversationId, content) => {
      await espaceClientService.sendConversationMessage(conversationId, content);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messageCount: (c.messageCount ?? 0) + 1, lastMessageAt: new Date().toISOString() }
            : c,
        ),
      );
    },
    [],
  );

  const createConversation = useCallback<EspaceClientData['createConversation']>(
    async (subject, message, dossierId) => {
      const conv = await espaceClientService.createConversation(subject, message, dossierId);
      setConversations((prev) => [conv, ...prev]);
      return conv;
    },
    [],
  );

  const getConversation = useCallback<EspaceClientData['getConversation']>(
    async (conversationId) => {
      return await espaceClientService.getConversation(conversationId);
    },
    [],
  );

  const getSharedDocument = useCallback<EspaceClientData['getSharedDocument']>(
    async (id) => {
      return espaceClientService.getSharedDocument(id);
    },
    [],
  );

  const visualiserSharedDocument = useCallback<EspaceClientData['visualiserSharedDocument']>(
    async (id) => {
      return espaceClientService.visualiserSharedDocument(id);
    },
    [],
  );

  const telechargerSharedDocument = useCallback<EspaceClientData['telechargerSharedDocument']>(
    async (id) => {
      return espaceClientService.telechargerSharedDocument(id);
    },
    [],
  );

  const value: EspaceClientData = {
    isLoading,
    hasError,
    lastSyncAt,
    client,
    myDossiers,
    myPieces,
    myDocs,
    myAppointments,
    myPayments,
    myNotifications,
    myConversations,
    unreadNotificationsCount,
    nextAppointment,
    pendingPayment,
    uploadPiece,
    getPartiesForDossier,
    getDossier,
    updateAppointment,
    requestProfileChange,
    changePassword,
    markNotificationsRead,
    pushSubscribe,
    getSharedDocument,
    visualiserSharedDocument,
    telechargerSharedDocument,
    getConversationMessages,
    sendConversationMessage,
    createConversation,
    getConversation,
    refetch,
  };

  return <EspaceClientDataContext.Provider value={value}>{children}</EspaceClientDataContext.Provider>;
}

export function useEspaceClientData(): EspaceClientData {
  const ctx = useContext(EspaceClientDataContext);
  if (!ctx) throw new Error('useEspaceClientData must be used within an EspaceClientDataProvider');
  return ctx;
}