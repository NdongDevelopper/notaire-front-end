import axios from 'axios';
import { api, API_BASE_URL } from '../../../shared/services/api';
import type {
  Dossier,
  DossierDocument,
  DossierParty,
  DossierStatusValue,
  DossierTask,
  PaginatedResponse,
} from '../types/case';

const unwrapCollection = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === 'object') {
    if ('results' in data) {
      const results = (data as PaginatedResponse<T>).results;
      return Array.isArray(results) ? results : [];
    }

    const flattened = Object.values(data).flatMap((value) => (Array.isArray(value) ? value : []));
    return flattened as T[];
  }

  return [];
};

const unwrapSingle = <T>(data: unknown): T => data as T;

// Résout une URL de fichier (champ "fichier" renvoyé par /documents/<id>/) en
// URL absolue, en pointant vers la vraie origine du backend plutôt que celle
// du frontend. Le proxy Vite (vite.config.ts) ne couvre que /api ; une URL
// relative doit donc être résolue différemment d'une simple requête API.
const resolveMediaUrl = (fichier: string): string => {
  if (/^https?:\/\//i.test(fichier)) {
    // Déjà absolue (host backend, CDN, S3 pré-signée...) : on la garde telle quelle.
    return fichier;
  }
  // Relative : si API_BASE_URL est configuré en absolu (VITE_API_BASE_URL réel),
  // on l'utilise comme origine de résolution. Sinon (mode proxy Vite, baseURL
  // relatif "/api"), on ne peut pas déduire l'origine réelle du backend depuis
  // le front — on résout contre l'origine courante (fonctionne si le fichier
  // est aussi servi/proxifié depuis le même domaine que l'app en production).
  const base = /^https?:\/\//i.test(API_BASE_URL) ? API_BASE_URL : window.location.origin;
  try {
    return new URL(fichier, base).toString();
  } catch {
    return fichier;
  }
};

export const caseService = {
  getDossiers: async (): Promise<Dossier[]> => {
    const response = await api.get<unknown>('/dossiers/');
    return unwrapCollection<Dossier>(response.data);
  },

  getKanbanDossiers: async (): Promise<Dossier[]> => {
    const response = await api.get<unknown>('/dossiers/kanban/');
    const data = response.data;

    if (Array.isArray(data)) {
      return data as Dossier[];
    }

    if (data && typeof data === 'object') {
      if ('results' in data && Array.isArray((data as any).results)) {
        return (data as any).results as Dossier[];
      }

      const values = Object.values(data as Record<string, unknown>);
      const flattened: Dossier[] = [];

      values.forEach((value) => {
        if (Array.isArray(value)) {
          flattened.push(...(value as Dossier[]));
        } else if (value && typeof value === 'object') {
          const group = value as any;
          if (Array.isArray(group.dossiers)) {
            flattened.push(...(group.dossiers as Dossier[]));
          } else if (Array.isArray(group.results)) {
            flattened.push(...(group.results as Dossier[]));
          }
        }
      });

      return flattened;
    }

    return [];
  },

  getDossier: async (id: string | number): Promise<Dossier> => {
    const response = await api.get<unknown>(`/dossiers/${id}/`);
    return unwrapSingle<Dossier>(response.data);
  },

  updateDossier: async (id: string | number, payload: Partial<Dossier> & { statut?: DossierStatusValue }): Promise<Dossier> => {
    const response = await api.patch<unknown>(`/dossiers/${id}/`, payload);
    return unwrapSingle<Dossier>(response.data);
  },

  deleteDossier: async (id: string | number): Promise<void> => {
    await api.delete(`/dossiers/${id}/`);
  },

  closeDossier: async (id: string | number): Promise<Dossier> => {
    const response = await api.post<unknown>(`/dossiers/${id}/cloturer/`);
    return unwrapSingle<Dossier>(response.data);
  },

  getParties: async (): Promise<DossierParty[]> => {
    const response = await api.get<unknown>('/parties/');
    return unwrapCollection<DossierParty>(response.data);
  },

  createParty: async (payload: Partial<DossierParty>): Promise<DossierParty> => {
    const response = await api.post<unknown>('/parties/', payload);
    return unwrapSingle<DossierParty>(response.data);
  },

  updateParty: async (id: string | number, payload: Partial<DossierParty>): Promise<DossierParty> => {
    const response = await api.patch<unknown>(`/parties/${id}/`, payload);
    return unwrapSingle<DossierParty>(response.data);
  },

  deleteParty: async (id: string | number): Promise<void> => {
    await api.delete(`/parties/${id}/`);
  },

  getTaches: async (): Promise<DossierTask[]> => {
    const response = await api.get<unknown>('/taches/');
    return unwrapCollection<DossierTask>(response.data);
  },

  createTache: async (payload: Record<string, unknown>): Promise<DossierTask> => {
    const response = await api.post<unknown>('/taches/', payload);
    return unwrapSingle<DossierTask>(response.data);
  },

  updateTache: async (id: string | number, payload: Record<string, unknown>): Promise<DossierTask> => {
    const response = await api.patch<unknown>(`/taches/${id}/`, payload);
    return unwrapSingle<DossierTask>(response.data);
  },

  deleteTache: async (id: string | number): Promise<void> => {
    await api.delete(`/taches/${id}/`);
  },

  getMesTaches: async (): Promise<DossierTask[]> => {
    const response = await api.get<unknown>('/taches/mes-taches/');
    return unwrapCollection<DossierTask>(response.data);
  },

  getTachesEnRetard: async (): Promise<DossierTask[]> => {
    const response = await api.get<unknown>('/taches/en-retard/');
    return unwrapCollection<DossierTask>(response.data);
  },

  getDocuments: async (): Promise<DossierDocument[]> => {
    const response = await api.get<unknown>('/documents/');
    return unwrapCollection<DossierDocument>(response.data);
  },

  getPaiements: async (): Promise<unknown[]> => {
    const response = await api.get<unknown>('/paiements/');
    return unwrapCollection<unknown>(response.data);
  },

  createPaiement: async (payload: Record<string, unknown>): Promise<unknown> => {
    const response = await api.post<unknown>('/paiements/', payload);
    return unwrapSingle<unknown>(response.data);
  },

  getLignesFinancieres: async (): Promise<unknown[]> => {
    const response = await api.get<unknown>('/lignes-financieres/');
    return unwrapCollection<unknown>(response.data);
  },

  createLigneFinanciere: async (payload: Record<string, unknown>): Promise<unknown> => {
    const response = await api.post<unknown>('/lignes-financieres/', payload);
    return unwrapSingle<unknown>(response.data);
  },

  createDocument: async (payload: Partial<DossierDocument>): Promise<DossierDocument> => {
    const response = await api.post<unknown>('/documents/', payload);
    return unwrapSingle<DossierDocument>(response.data);
  },

  updateDocument: async (id: string | number, payload: Partial<DossierDocument>): Promise<DossierDocument> => {
    const response = await api.patch<unknown>(`/documents/${id}/`, payload);
    return unwrapSingle<DossierDocument>(response.data);
  },

  uploadDocumentFile: async (id: string | number, file: File): Promise<DossierDocument> => {
    const formData = new FormData();
    formData.append('fichier', file);
    const response = await api.patch<unknown>(`/documents/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapSingle<DossierDocument>(response.data);
  },

  // La doc API ne liste pas d'endpoint de téléchargement dédié, donc on
  // récupère la fiche du document pour lire l'URL réelle du fichier
  // (champ "fichier"), puis on télécharge ce fichier en blob.
  //
  // PROBLÈME RÉSOLU ICI : le proxy Vite (vite.config.ts) ne couvre que /api,
  // pas /media. Si le backend renvoie une URL RELATIVE ("/media/xyz.pdf"), une
  // requête directe part vers l'origine du FRONTEND (pas le backend) -> 404.
  // Et si le backend renvoie une URL ABSOLUE vers un autre host (ex: le domaine
  // Render de l'API), une requête script (axios/fetch) est soumise au CORS —
  // or django-cors-headers n'autorise en général que les chemins /api/*, donc
  // le navigateur bloque silencieusement la lecture du fichier en blob.
  //
  // Stratégie : on résout d'abord l'URL en absolue vers le vrai host backend
  // (resolveMediaUrl). On tente ensuite un fetch en blob (pour proposer un vrai
  // téléchargement avec le bon nom de fichier). Si ce fetch échoue (CORS ou
  // autre), on renvoie blob=null : l'appelant doit alors ouvrir l'URL en
  // navigation directe (window.open), qui n'est PAS soumise au CORS.
  downloadDocument: async (id: string | number): Promise<{ blob: Blob | null; filename: string; url: string }> => {
    const detailResponse = await api.get<unknown>(`/documents/${id}/`);
    const doc = unwrapSingle<DossierDocument>(detailResponse.data);

    if (!doc?.fichier) {
      throw new Error("Aucun fichier disponible pour ce document.");
    }

    const resolvedUrl = resolveMediaUrl(doc.fichier);
    const urlFilename = resolvedUrl.split('/').pop()?.split('?')[0];
    const fallbackFilename = decodeURIComponent(urlFilename || doc.nom || `document_${id}`);

    try {
      // Pas de credentials : la plupart des backends servent les médias sans
      // vérifier le cookie/JWT de l'app (le token Bearer de `api` ne s'applique
      // qu'aux appels /api). En envoyer inutilement peut au contraire déclencher
      // un préflight CORS plus strict.
      const fileResponse = await axios.get(resolvedUrl, {
        responseType: 'blob',
        withCredentials: false,
      });

      const contentDisposition = fileResponse.headers?.['content-disposition'] as string | undefined;
      const dispositionMatch = contentDisposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      const filename = decodeURIComponent(dispositionMatch?.[1] || fallbackFilename);

      return { blob: fileResponse.data as Blob, filename, url: resolvedUrl };
    } catch {
      // Échec probable dû au CORS (ou fichier protégé) : on laisse l'appelant
      // faire une navigation directe vers resolvedUrl plutôt que planter.
      return { blob: null, filename: fallbackFilename, url: resolvedUrl };
    }
  },

  deleteDocument: async (id: string | number): Promise<void> => {
    await api.delete(`/documents/${id}/`);
  },

  shareDocument: async (id: string | number): Promise<{ shared_url: string; document_id: string }> => {
    const response = await api.post<unknown>(`/documents/${id}/partager/`);
    return unwrapSingle<{ shared_url: string; document_id: string }>(response.data);
  },
};

export default caseService;