// src/features/cases/helpers/mappers.ts

import type { DossierTask, CaseStatus } from "../types/case";
import type { ExtendedCase } from "../types/case-details";

export const mapDossierToCase = (dossier: any, fallbackId?: string): ExtendedCase => {
  let responsableName = "Non assigné";
  if (dossier?.responsable) {
    if (typeof dossier.responsable === 'object' && dossier.responsable !== null) {
      responsableName = `${dossier.responsable.first_name || ""} ${dossier.responsable.last_name || ""}`.trim() || dossier.responsable.username || "Non assigné";
    } else {
      responsableName = dossier.responsable_nom || String(dossier.responsable);
    }
  }

  let typeActeLibelle = "Dossier";
  if (dossier?.type_acte_libelle) {
    typeActeLibelle = dossier.type_acte_libelle;
  } else if (dossier?.type_acte) {
    typeActeLibelle = typeof dossier.type_acte === 'object' && dossier.type_acte !== null
      ? (dossier.type_acte as any).libelle || String(dossier.type_acte)
      : String(dossier.type_acte);
  }

  const statutLower = (dossier?.statut || "ouvert").toLowerCase();
  const status = (statutLower === "ouvert" ? "OUVERT"
    : statutLower === "pieces_en_cours" ? "PIECES_EN_COURS"
    : statutLower === "en_redaction" ? "REDACTION"
    : statutLower === "validation" ? "VALIDATION"
    : statutLower === "signature" ? "SIGNATURE"
    : statutLower === "formalites" ? "FORMALITES"
    : statutLower === "cloture" ? "CLOTURE"
    : statutLower === "archive" ? "ARCHIVE"
    : "OUVERT") as CaseStatus;

  return {
    id: String(dossier?.id || fallbackId || ""),
    type: typeActeLibelle,
    status,
    responsible: responsableName,
    createdAt: dossier?.created_at || dossier?.date_cible || "Non définie",
    clients: Array.isArray(dossier?.parties) && dossier.parties.length > 0
      ? dossier.parties.map((party: any, index: number) => {
          // L'API peut renvoyer le client lié à la partie sous forme d'objet
          // ({ id, nom }), d'un id brut, ou l'omettre. Pour créer un rendez-vous,
          // le backend attend l'ID du CLIENT (FK du modèle Client) et non celui
          // de la Partie — on privilégie donc party.client.id.
          const partyClient = party?.client && typeof party.client === 'object'
            ? party.client
            : party?.client != null
              ? { id: party.client }
              : null;
          return {
            id: partyClient?.id?.toString() || party?.id?.toString() || `${dossier?.id || fallbackId}-${index}`,
            name: party?.nom || partyClient?.nom || `Client ${index + 1}`,
            role: party?.role || "Partie",
          };
        })
      : dossier?.client_nom
        ? [{ id: String(dossier?.client ?? `${dossier?.id || fallbackId}-0`), name: dossier.client_nom, role: "Client" }]
        : [],
  };
};

export const enrichTaskWithUserData = (task: any, usersList: any[]): DossierTask => {
  const commentaire = task.commentaire || task.comment || '';
  
  // Enrichir assigne_a (responsable)
  let assigneA = task.assigne_a;
  let assigneAId: string | null = null;
  
  if (task.assigne_a) {
    // Récupérer l'ID du responsable
    if (typeof task.assigne_a === 'object' && task.assigne_a !== null) {
      assigneAId = task.assigne_a.id || '';
    } else {
      assigneAId = String(task.assigne_a);
    }
    
    // Chercher l'utilisateur dans la liste
    const user = usersList.find(u => u.id === assigneAId);
    if (user) {
      assigneA = {
        ...user,
        id: user.id,
      } as any;
    } else {
      // Si l'utilisateur n'est pas trouvé, garder l'ID comme string
      assigneA = assigneAId;
    }
  }
  
  // Enrichir created_by (créateur)
  let createdBy = task.created_by;
  let createdById: string | null = null;
  
  if (task.created_by) {
    // Récupérer l'ID du créateur
    if (typeof task.created_by === 'object' && task.created_by !== null) {
      createdById = task.created_by.id || '';
    } else {
      createdById = String(task.created_by);
    }
    
    // Chercher l'utilisateur dans la liste
    const user = usersList.find(u => u.id === createdById);
    if (user) {
      createdBy = {
        ...user,
        id: user.id,
      } as any;
    } else {
      // Si l'utilisateur n'est pas trouvé, garder l'ID comme string
      createdBy = createdById;
    }
  }
  
  return {
    ...task,
    commentaire: commentaire,
    assigne_a: assigneA,
    created_by: createdBy,
  };
};

export const formatApiError = (error: any, fallback: string): string => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (data.non_field_errors?.[0]) return data.non_field_errors[0];
  if (typeof data === 'object') {
    const entries = Object.entries(data).map(
      ([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
    );
    if (entries.length > 0) return entries.join(' | ');
  }
  return fallback;
};