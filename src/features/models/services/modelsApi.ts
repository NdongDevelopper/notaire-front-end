// services/modelsApi.ts
// Couche d'accès aux endpoints REST du module "Modèles d'actes".
// Authentification: cookie JWT (core.authentication.CookieJWTAuthentication
// côté backend), d'où credentials: "include" sur chaque appel.

import { api, buildApiUrl } from "../../../shared/services/api";
import axios from "axios";

import type {
  ChecklistPiece,
  ChecklistPieceInput,
  Etude,
  EtudeInput,
  EtapeWorkflow,
  EtapeWorkflowInput,
  ModeleActe,
  ModeleActeInput,
  TypeActe,
  TypeActeInput,
} from "../types/models";

const CSRF_COOKIE_NAME = "csrftoken";
const CSRF_HEADER_NAME = "X-CSRFToken";
const METHODES_PROTEGEES = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class ModelsApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ModelsApiError";
    this.status = status;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function getHeaders(method: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (METHODES_PROTEGEES.has(method.toUpperCase())) {
    const csrfToken = getCookie(CSRF_COOKIE_NAME);
    if (csrfToken) headers[CSRF_HEADER_NAME] = csrfToken;
  }
  return headers;
}

/**
 * Extrait un message d'erreur lisible depuis le corps de la réponse.
 */
function extraireMessageErreur(corpsBrut: unknown, status: number, path: string): string {
  if (typeof corpsBrut === "string" && corpsBrut) {
    try {
      const donnees = JSON.parse(corpsBrut);
      if (typeof donnees?.detail === "string" && donnees.detail.trim()) return donnees.detail;
      if (donnees && typeof donnees === "object") {
        for (const valeur of Object.values(donnees)) {
          if (Array.isArray(valeur)) {
            const premierMessage = valeur.find((v) => typeof v === "string" && v.trim());
            if (premierMessage) return String(premierMessage);
          }
          if (typeof valeur === "string" && valeur.trim()) return valeur;
        }
      }
    } catch {
      // Corps non JSON : on utilise le message générique ci-dessous.
    }
  } else if (corpsBrut && typeof corpsBrut === "object") {
    const donnees = corpsBrut as Record<string, unknown>;
    if (typeof donnees.detail === "string" && donnees.detail.trim()) return donnees.detail;
    for (const valeur of Object.values(donnees)) {
      if (Array.isArray(valeur)) {
        const premierMessage = valeur.find((v) => typeof v === "string" && v.trim());
        if (premierMessage) return String(premierMessage);
      }
      if (typeof valeur === "string" && valeur.trim()) return valeur;
    }
  }

  if (status === 0) return "Connexion impossible. Les données déjà synchronisées restent disponibles hors ligne.";
  if (status === 401) return "Session expirée, veuillez vous reconnecter.";
  if (status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  if (status === 404) return "Ressource introuvable.";
  if (status >= 500) return "Le serveur a rencontré une erreur. Veuillez réessayer.";
  return `Une erreur est survenue lors de l'appel à ${path} (code ${status}).`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toString().toUpperCase();
  const headers = getHeaders(method);

  try {
    const response = await api.request<T>({
      url: path,
      method,
      data: options.body,
      headers,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      throw new ModelsApiError(
        extraireMessageErreur(error.response?.data, status, path),
        status,
      );
    }
    throw error;
  }
}

function normaliserModeleActe(dto: any): ModeleActe {
  return {
    id: dto.id ?? dto.pk ?? String(dto.id ?? dto.pk ?? ""),
    titre: dto.titre ?? dto.title ?? "",
    type_acte:
      dto.type_acte ?? dto.typeActe ?? dto.typeActeCode ?? dto.type_acte_id ?? dto.typeActeId ?? "",
    contenu: dto.contenu ?? dto.content ?? "",
    variables: Array.isArray(dto.variables) ? dto.variables : [],
    // Champs utilisés par ModelCard : statut, version - absents de la
    // version précédente de ce mapper, ce qui affichait toujours "Brouillon"
    // et "v1" même pour un modèle déjà validé ou dupliqué.
    statut: dto.statut ?? dto.status ?? "Brouillon",
    version: dto.version ?? 1,
    archive: dto.archive ?? false,
    created_at:
      dto.created_at ?? dto.createdAt ?? dto.date_creation ?? dto.date_created ?? dto.dateCreation ?? null,
    createdAt:
      dto.createdAt ?? dto.created_at ?? dto.date_creation ?? dto.date_created ?? dto.dateCreation ?? null,
    updated_at:
      dto.updated_at ?? dto.updatedAt ?? dto.date_modification ?? dto.date_modif ?? dto.date_maj ?? dto.dateMaj ?? null,
    updatedAt:
      dto.updatedAt ?? dto.updated_at ?? dto.date_modification ?? dto.date_modif ?? dto.date_maj ?? dto.dateMaj ?? null,
    derniere_maj:
      dto.derniere_maj ?? dto.derniereMaj ?? dto.date_maj ?? dto.dateMaj ?? dto.updated_at ?? dto.updatedAt ?? null,
    derniereMaj:
      dto.derniereMaj ?? dto.derniere_maj ?? dto.dateMaj ?? dto.date_maj ?? dto.updatedAt ?? dto.updated_at ?? null,
  };
}

function normaliserReponseModeleActe(res: any): ModeleActe[] {
  if (Array.isArray(res)) return res.map(normaliserModeleActe);
  const maybeResults = res?.results;
  if (Array.isArray(maybeResults)) return maybeResults.map(normaliserModeleActe);
  console.warn("listerModeles: unexpected response shape, returning empty array", res);
  return [];
}

// ---------------------------------------------------------------------------
// Étude — /api/etude/
// ---------------------------------------------------------------------------

export function listerEtudes(): Promise<Etude[]> {
  return request<Etude[]>(`/etude/`);
}

export function obtenirEtude(id: number): Promise<Etude> {
  return request<Etude>(`/etude/${id}/`);
}

export function creerEtude(payload: EtudeInput): Promise<Etude> {
  return request<Etude>(`/etude/`, { method: "POST", body: JSON.stringify(payload) });
}

export function modifierEtude(id: number, payload: Partial<EtudeInput>): Promise<Etude> {
  return request<Etude>(`/etude/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
}

// ---------------------------------------------------------------------------
// Types d'actes — /api/types-actes/
// ---------------------------------------------------------------------------

export function listerTypesActes(): Promise<TypeActe[]> {
  return request<any>(`/types-actes/options/`)
    .then((res) => (Array.isArray(res) ? (res as TypeActe[]) : []))
    .catch(async (err) => {
      // Repli sur la liste paginée si /options/ n'est pas disponible
      // (ex: backend pas encore redéployé).
      if (err instanceof ModelsApiError && err.status === 404) {
        const res = await request<any>(`/types-actes/?page_size=1000`);
        const maybeResults = Array.isArray(res) ? res : res?.results;
        return Array.isArray(maybeResults) ? (maybeResults as TypeActe[]) : [];
      }
      console.error("Erreur listerTypesActes:", err);
      return [];
    });
}

export function obtenirTypeActe(id: number): Promise<TypeActe> {
  return request<TypeActe>(`/types-actes/${id}/`);
}

export function creerTypeActe(payload: TypeActeInput): Promise<TypeActe> {
  return request<TypeActe>(`/types-actes/`, { method: "POST", body: JSON.stringify(payload) });
}

export function modifierTypeActe(id: number, payload: Partial<TypeActeInput>): Promise<TypeActe> {
  return request<TypeActe>(`/types-actes/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function supprimerTypeActe(id: number): Promise<void> {
  return request<void>(`/types-actes/${id}/`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Étapes de workflow — /api/etapes-workflow/
// ---------------------------------------------------------------------------

export function listerEtapesWorkflow(typeActeId?: number): Promise<EtapeWorkflow[]> {
  const query = typeActeId ? `?type_acte=${typeActeId}` : "";
  return request<EtapeWorkflow[]>(`/etapes-workflow/${query}`);
}

export function creerEtapeWorkflow(payload: EtapeWorkflowInput): Promise<EtapeWorkflow> {
  return request<EtapeWorkflow>(`/etapes-workflow/`, { method: "POST", body: JSON.stringify(payload) });
}

export function modifierEtapeWorkflow(
  id: number,
  payload: Partial<EtapeWorkflowInput>
): Promise<EtapeWorkflow> {
  return request<EtapeWorkflow>(`/etapes-workflow/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function supprimerEtapeWorkflow(id: number): Promise<void> {
  return request<void>(`/etapes-workflow/${id}/`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Checklist des pièces — /api/checklist-pieces/
// ---------------------------------------------------------------------------

export function listerChecklistPieces(typeActeId?: number): Promise<ChecklistPiece[]> {
  const query = typeActeId ? `?type_acte=${typeActeId}` : "";
  return request<ChecklistPiece[]>(`/checklist-pieces/${query}`);
}

export function creerChecklistPiece(payload: ChecklistPieceInput): Promise<ChecklistPiece> {
  return request<ChecklistPiece>(`/checklist-pieces/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function modifierChecklistPiece(
  id: number,
  payload: Partial<ChecklistPieceInput>
): Promise<ChecklistPiece> {
  return request<ChecklistPiece>(`/checklist-pieces/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function supprimerChecklistPiece(id: number): Promise<void> {
  return request<void>(`/checklist-pieces/${id}/`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Modèles d'actes — /api/modeles-actes/
// ---------------------------------------------------------------------------

export function listerModeles(typeActeCode?: string): Promise<ModeleActe[]> {
  const query = typeActeCode && typeActeCode !== "tous" ? `?type_acte=${typeActeCode}` : "";
  return request<ModeleActe[]>(`/modeles-actes/${query}`)
    .then(normaliserReponseModeleActe)
    .catch((err) => {
      console.error("Erreur listerModeles:", err);
      return [] as ModeleActe[];
    });
}

export function obtenirModele(id: string): Promise<ModeleActe> {
  return request<ModeleActe>(`/modeles-actes/${id}/`).then(normaliserModeleActe);
}

export function creerModele(payload: ModeleActeInput): Promise<ModeleActe> {
  return request<ModeleActe>(`/modeles-actes/`, { method: "POST", body: JSON.stringify(payload) }).then(normaliserModeleActe);
}

export function modifierModele(id: string, payload: Partial<ModeleActeInput>): Promise<ModeleActe> {
  return request<ModeleActe>(`/modeles-actes/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }).then(normaliserModeleActe);
}

export function supprimerModele(id: string): Promise<void> {
  return request<void>(`/modeles-actes/${id}/`, { method: "DELETE" });
}

export function dupliquerModele(id: string): Promise<ModeleActe> {
  return request<ModeleActe>(`/modeles-actes/${id}/dupliquer/`, { method: "POST" }).then(normaliserModeleActe);
}

export function archiverModele(id: string): Promise<ModeleActe> {
  return request<ModeleActe>(`/modeles-actes/${id}/archiver/`, { method: "POST" }).then(normaliserModeleActe);
}

export function changerStatutModele(id: string, statut: string): Promise<ModeleActe> {
  return request<ModeleActe>(`/modeles-actes/${id}/statut/`, {
    method: "PATCH",
    body: JSON.stringify({ statut }),
  }).then(normaliserModeleActe);
}

export async function genererPdfModele(id: string, dossierId: string): Promise<Blob> {
  const method = "POST";
  const response = await fetch(buildApiUrl(`/modeles-actes/${id}/generer-pdf/`), {
    method,
    credentials: "include",
    headers: {
      ...getHeaders(method),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dossier: dossierId }),
  });

  if (!response.ok) {
    const corpsBrut = await response.text().catch(() => "");
    throw new ModelsApiError(
      extraireMessageErreur(corpsBrut, response.status, `/modeles-actes/${id}/generer-pdf/`),
      response.status
    );
  }

  return await response.blob();
}