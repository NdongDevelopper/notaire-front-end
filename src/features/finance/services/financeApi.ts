// services/financeApi.ts
// Fine couche d'accès aux endpoints REST du module Finances.
// Utilise l'instance axios partagée pour la cohérence avec le reste de l'app.

import { api } from "../../../shared/services/api";
import { parseMontant } from "../types/finance";
import type { LigneFinanciere, LigneFinanciereInput } from "../types/invoice";
import type { Paiement, PaiementInput, SituationFinanciere } from "../types/payment";

function getConfiguredEndpoint(envVarName: string, fallback: string): string {
  const value = import.meta.env?.[envVarName as keyof ImportMetaEnv];
  if (typeof value === "string" && value.trim()) {
    return value.startsWith("/") || /^https?:\/\//i.test(value) ? value : `/${value}`;
  }
  return fallback;
}

const financeEndpoints = {
  lines: getConfiguredEndpoint("VITE_FINANCE_LINES_ENDPOINT", "/lignes-financieres"),
  payments: getConfiguredEndpoint("VITE_FINANCE_PAYMENTS_ENDPOINT", "/paiements"),
  situation: getConfiguredEndpoint("VITE_FINANCE_SITUATION_ENDPOINT", "/paiements/situation"),
};

const ensureArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }
  return [];
};

function normalizeString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function normalizeAmount(value: unknown): string | number | null | undefined {
  if (typeof value === "string" || typeof value === "number") return value;
  return undefined;
}

function normalizeLigneFinanciere(value: Record<string, unknown>): LigneFinanciere {
  return {
    id: String(value.id ?? ""),
    dossier: String(value.dossier ?? ""),
    dossier_numero: normalizeString(value.dossier_numero) ?? normalizeString(value.dossierNumero),
    categorie: String(value.categorie ?? "autre") as LigneFinanciere["categorie"],
    categorie_display: normalizeString(value.categorie_display) ?? normalizeString(value.categorieDisplay),
    libelle: normalizeString(value.libelle) ?? "",
    montant: parseMontant(normalizeAmount(value.montant)),
    created_at: normalizeString(value.created_at) ?? normalizeString(value.createdAt),
    updated_at: normalizeString(value.updated_at) ?? normalizeString(value.updatedAt),
  };
}

function normalizePaiement(value: Record<string, unknown>): Paiement {
  return {
    id: String(value.id ?? ""),
    dossier: String(value.dossier ?? ""),
    dossier_numero: normalizeString(value.dossier_numero) ?? normalizeString(value.dossierNumero),
    montant: parseMontant(normalizeAmount(value.montant)),
    date_paiement: normalizeString(value.date_paiement) ?? normalizeString(value.datePaiement) ?? "",
    mode: String(value.mode ?? "autre") as Paiement["mode"],
    mode_display: normalizeString(value.mode_display) ?? normalizeString(value.modeDisplay),
    reference: normalizeString(value.reference),
    recu_url: normalizeString(value.recu_url) ?? normalizeString(value.recuUrl),
    enregistre_par: normalizeString(value.enregistre_par) ?? normalizeString(value.enregistrePar),
    enregistre_par_nom: normalizeString(value.enregistre_par_nom) ?? normalizeString(value.enregistreParNom),
    created_at: normalizeString(value.created_at) ?? normalizeString(value.createdAt),
    updated_at: normalizeString(value.updated_at) ?? normalizeString(value.updatedAt),
  };
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const err = error as { 
      response?: { 
        data?: { 
          detail?: string; 
          message?: string; 
          error?: string;
          non_field_errors?: string[];
        }; 
        status?: number;
      }; 
      message?: string;
    };
    
    // Handle 404 errors specifically
    if (err.response?.status === 404) {
      return "Ressource non trouvée (404). L'endpoint demandé n'existe pas.";
    }
    
    // Handle 403/401 errors
    if (err.response?.status === 403) {
      return "Accès refusé. Vous n'avez pas les permissions nécessaires.";
    }
    if (err.response?.status === 401) {
      return "Non authentifié. Veuillez vous reconnecter.";
    }
    
    // Handle validation errors
    if (err.response?.data?.non_field_errors) {
      return err.response.data.non_field_errors.join(', ');
    }
    
    // Handle standard Django REST error formats
    if (err.response?.data?.detail) return err.response.data.detail;
    if (err.response?.data?.message) return err.response.data.message;
    if (err.response?.data?.error) return err.response.data.error;
    if (err.message) return err.message;
  }
  return "Une erreur inattendue s'est produite";
}

// ---------------------------------------------------------------------------
// Lignes financières (honoraires, débours, droits/taxes, frais, autres)
// ---------------------------------------------------------------------------

export async function listerLignesFinancieres(dossierId?: string): Promise<LigneFinanciere[]> {
  try {
    const query = dossierId ? `?dossier=${encodeURIComponent(dossierId)}` : "";
    const response = await api.get<unknown>(`${financeEndpoints.lines}${query}`);
    return ensureArray<Record<string, unknown>>(response.data).map(normalizeLigneFinanciere);
  } catch (error) {
    throw new Error(`Impossible de charger les lignes financières: ${getErrorMessage(error)}`);
  }
}

export async function obtenirLigneFinanciere(id: string): Promise<LigneFinanciere> {
  try {
    const response = await api.get<Record<string, unknown>>(`${financeEndpoints.lines}/${id}/`);
    return normalizeLigneFinanciere(response.data);
  } catch (error) {
    throw new Error(`Impossible de charger la ligne financière: ${getErrorMessage(error)}`);
  }
}

export async function creerLigneFinanciere(payload: LigneFinanciereInput): Promise<LigneFinanciere> {
  try {
    const response = await api.post<Record<string, unknown>>(financeEndpoints.lines, payload);
    return normalizeLigneFinanciere(response.data);
  } catch (error) {
    throw new Error(`Impossible de créer la ligne financière: ${getErrorMessage(error)}`);
  }
}

export async function modifierLigneFinanciere(
  id: string,
  payload: Partial<LigneFinanciereInput>
): Promise<LigneFinanciere> {
  try {
    const response = await api.patch<Record<string, unknown>>(`${financeEndpoints.lines}/${id}/`, payload);
    return normalizeLigneFinanciere(response.data);
  } catch (error) {
    throw new Error(`Impossible de modifier la ligne financière: ${getErrorMessage(error)}`);
  }
}

export async function supprimerLigneFinanciere(id: string): Promise<void> {
  try {
    await api.delete(`${financeEndpoints.lines}/${id}/`);
  } catch (error) {
    throw new Error(`Impossible de supprimer la ligne financière: ${getErrorMessage(error)}`);
  }
}

// ---------------------------------------------------------------------------
// Paiements (règlements)
// ---------------------------------------------------------------------------

export async function listerPaiements(dossierId?: string): Promise<Paiement[]> {
  try {
    const query = dossierId ? `?dossier=${encodeURIComponent(dossierId)}` : "";
    const response = await api.get<unknown>(`${financeEndpoints.payments}${query}`);
    return ensureArray<Record<string, unknown>>(response.data).map(normalizePaiement);
  } catch (error) {
    throw new Error(`Impossible de charger les paiements: ${getErrorMessage(error)}`);
  }
}

export async function obtenirPaiement(id: string): Promise<Paiement> {
  try {
    const response = await api.get<Record<string, unknown>>(`${financeEndpoints.payments}/${id}/`);
    return normalizePaiement(response.data);
  } catch (error) {
    throw new Error(`Impossible de charger le paiement: ${getErrorMessage(error)}`);
  }
}

export async function creerPaiement(payload: PaiementInput): Promise<Paiement> {
  try {
    const response = await api.post<Record<string, unknown>>(financeEndpoints.payments, payload);
    return normalizePaiement(response.data);
  } catch (error) {
    throw new Error(`Impossible de créer le paiement: ${getErrorMessage(error)}`);
  }
}

export async function modifierPaiement(
  id: string,
  payload: Partial<PaiementInput>
): Promise<Paiement> {
  try {
    const response = await api.patch<Record<string, unknown>>(`${financeEndpoints.payments}/${id}/`, payload);
    return normalizePaiement(response.data);
  } catch (error) {
    throw new Error(`Impossible de modifier le paiement: ${getErrorMessage(error)}`);
  }
}

export async function supprimerPaiement(id: string): Promise<void> {
  try {
    await api.delete(`${financeEndpoints.payments}/${id}/`);
  } catch (error) {
    throw new Error(`Impossible de supprimer le paiement: ${getErrorMessage(error)}`);
  }
}

// ---------------------------------------------------------------------------
// Situation financière d'un dossier (total facturé, payé, reste à payer, statut)
// ---------------------------------------------------------------------------

export async function obtenirSituationFinanciere(dossierId: string): Promise<SituationFinanciere> {
  try {
    const response = await api.get<Record<string, unknown>>(`${financeEndpoints.situation}/${dossierId}/`);
    const payload = response.data;

    return {
      dossier: String(payload.dossier ?? dossierId),
      total_facture: parseMontant(normalizeAmount(payload.total_facture)),
      total_paye: parseMontant(normalizeAmount(payload.total_paye)),
      reste_a_payer: parseMontant(normalizeAmount(payload.reste_a_payer)),
      statut_financier: String(payload.statut_financier ?? "non_facture"),
      lignes: Array.isArray(payload.lignes)
        ? (payload.lignes as Record<string, unknown>[]).map(normalizeLigneFinanciere)
        : undefined,
      paiements: Array.isArray(payload.paiements)
        ? (payload.paiements as Record<string, unknown>[]).map(normalizePaiement)
        : undefined,
    };
  } catch (error) {
    throw new Error(`Impossible de charger la situation financière: ${getErrorMessage(error)}`);
  }
}
