import type {
  Appointment,
  Client,
  Conversation,
  Dossier,
  Payment,
  Piece,
  PortalNotification,
  SharedDocument,
} from '../types/client.types';

// Snapshot localStorage des données déjà chargées du portail client.
//
// La volumétrie est faible (listes JSON de quelques dizaines de Ko au
// maximum, aucun fichier binaire — les fichiers eux-mêmes restent dans le
// cache du service worker) : localStorage suffit, est synchrone, et évite
// une couche IndexedDB asynchrone pour un simple repli d'affichage.
//
// La source de vérité reste l'API : EspaceClientDataContext rafraîchit ce
// snapshot à chaque chargement réussi et s'en sert uniquement pour afficher
// un mode dégradé hors ligne (« dernières données synchronisées le … »).
const PORTAL_DATA_KEY = 'espace-client:portal-data:v1';
const PORTAL_SYNC_KEY = 'espace-client:last-sync:v1';

export interface PortalDataSnapshot {
  /** Id du client propriétaire du snapshot — évite d'afficher les données d'un autre utilisateur sur le même appareil. */
  ownerId: string | null;
  client: Client | null;
  dossiers: Dossier[];
  pieces: Piece[];
  docs: SharedDocument[];
  appointments: Appointment[];
  payments: Payment[];
  notifications: PortalNotification[];
  conversations: Conversation[];
}

/** Écrit le snapshot + l'horodatage de synchronisation. Retourne la date de synchro ISO. */
export function savePortalData(snapshot: PortalDataSnapshot): string {
  const syncedAt = new Date().toISOString();
  try {
    localStorage.setItem(PORTAL_DATA_KEY, JSON.stringify(snapshot));
    localStorage.setItem(PORTAL_SYNC_KEY, syncedAt);
  } catch {
    // Quota dépassé ou navigation privée : on ignore, le prochain
    // chargement réessayera. La synchro retournée n'est alors pas persistée.
  }
  return syncedAt;
}

export function loadPortalData(ownerId: string | null): { snapshot: PortalDataSnapshot; syncedAt: string | null } | null {
  try {
    const raw = localStorage.getItem(PORTAL_DATA_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as PortalDataSnapshot;
    if (!snapshot || !Array.isArray(snapshot.dossiers) || !Array.isArray(snapshot.pieces)) return null;
    // Propriétaire différent (autre compte sur le même appareil) : on
    // refuse le repli plutôt que d'afficher les données du compte précédent.
    if ((snapshot.ownerId ?? null) !== (ownerId ?? null)) return null;
    return { snapshot, syncedAt: localStorage.getItem(PORTAL_SYNC_KEY) };
  } catch {
    return null;
  }
}

export function clearPortalData(): void {
  try {
    localStorage.removeItem(PORTAL_DATA_KEY);
    localStorage.removeItem(PORTAL_SYNC_KEY);
  } catch {
    // Stockage inaccessible : rien à purger.
  }
}
