// types/finance.ts
// Enumérations et libellés partagés du module Finances (cahier des charges, section 15)

export type CategorieFinanciere =
  | "honoraires"
  | "debours"
  | "droits_taxes"
  | "frais_admin"
  | "autre";

export type ModePaiement =
  | "especes"
  | "cheque"
  | "virement"
  | "mobile_money"
  | "autre";

export type StatutFinancier =
  | "non_facture"
  | "en_attente_provision"
  | "partiellement_paye"
  | "solde"
  | "en_retard_paiement";

export const CATEGORIE_LABELS: Record<CategorieFinanciere, string> = {
  honoraires: "Honoraires",
  debours: "Débours",
  droits_taxes: "Droits et taxes",
  frais_admin: "Frais administratifs",
  autre: "Autre",
};

export const MODE_LABELS: Record<ModePaiement, string> = {
  especes: "Espèces",
  cheque: "Chèque",
  virement: "Virement",
  mobile_money: "Mobile money",
  autre: "Autre",
};

export const STATUT_LABELS: Record<StatutFinancier, string> = {
  non_facture: "Non facturé",
  en_attente_provision: "En attente de provision",
  partiellement_paye: "Partiellement payé",
  solde: "Soldé",
  en_retard_paiement: "En retard de paiement",
};

// Couleurs utilitaires (classes Tailwind) associées à chaque statut,
// pour un affichage cohérent des badges dans toute l'application.
export const STATUT_BADGE_CLASSES: Record<StatutFinancier, string> = {
  non_facture: "bg-slate-100 text-slate-600 border border-slate-200",
  en_attente_provision: "bg-amber-50 text-amber-700 border border-amber-200",
  partiellement_paye: "bg-sky-50 text-sky-700 border border-sky-200",
  solde: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  en_retard_paiement: "bg-rose-50 text-rose-700 border border-rose-200",
};

export const CATEGORIES: CategorieFinanciere[] = [
  "honoraires",
  "debours",
  "droits_taxes",
  "frais_admin",
  "autre",
];

export const MODES_PAIEMENT: ModePaiement[] = [
  "especes",
  "cheque",
  "virement",
  "mobile_money",
  "autre",
];

/**
 * Formate un montant en francs CFA, séparateurs d'espace, sans décimales
 * (usage courant au Sénégal pour les montants notariés).
 */
export function parseMontant(montant: number | string | null | undefined): number {
  if (typeof montant === "number") {
    return Number.isFinite(montant) ? montant : 0;
  }
  if (typeof montant === "string") {
    const cleaned = montant.trim().replace(/\s+/g, "").replace(/[^\d,.-]/g, "");
    if (!cleaned) return 0;

    if (cleaned.includes(",") && cleaned.includes(".")) {
      const lastComma = cleaned.lastIndexOf(",");
      const lastDot = cleaned.lastIndexOf(".");
      const decimalSeparator = lastComma > lastDot ? "," : ".";
      const thousandsSeparator = decimalSeparator === "," ? "." : ",";
      const normalized = cleaned
        .replace(new RegExp(`\\${thousandsSeparator}`, "g"), "")
        .replace(decimalSeparator, ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    if (cleaned.includes(",")) {
      const parts = cleaned.split(",");
      if (parts.length === 2 && parts[1].length <= 2) {
        const parsed = Number(`${parts[0]}.${parts[1]}`);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      const parsed = Number(parts.join(""));
      return Number.isFinite(parsed) ? parsed : 0;
    }

    if (cleaned.includes(".")) {
      const parts = cleaned.split(".");
      if (parts.length === 2 && parts[1].length <= 2) {
        const parsed = Number(`${parts[0]}.${parts[1]}`);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      const parsed = Number(parts.join(""));
      return Number.isFinite(parsed) ? parsed : 0;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function formatMontantFCFA(montant?: number | string | null): string {
  const n = Math.round(parseMontant(montant));

  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(n);

  const normalized = formatted
    .replace(/[\u00A0\u202F\u2007\u2009]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `${normalized} FCFA`;
}

/**
 * Libellé lisible d'un dossier pour l'affichage (numéro de dossier si connu,
 * repli sur un extrait de l'UUID plutôt qu'un "Inconnu" muet). À terme,
 * privilégier un `dossier_numero` renvoyé directement par l'API (jointure
 * backend) pour éviter ce repli.
 */
export function libelleDossier(dossierId: string, dossierNumero?: string): string {
  if (dossierNumero) return dossierNumero;
  return `Dossier ${dossierId.slice(0, 8)}…`;
}

/**
 * Détermine le statut financier d'un dossier à partir du total facturé
 * et du total payé. Sert de repli côté client si l'API ne renvoie pas
 * directement le statut (ex: écran d'aperçu avant sauvegarde).
 */
export function deriveStatutFinancier(
  totalFacture: number,
  totalPaye: number,
  dateEcheanceDepassee: boolean = false
): StatutFinancier {
  if (totalFacture <= 0) return "non_facture";
  if (totalPaye <= 0) {
    return dateEcheanceDepassee ? "en_retard_paiement" : "en_attente_provision";
  }
  if (totalPaye >= totalFacture) return "solde";
  return dateEcheanceDepassee ? "en_retard_paiement" : "partiellement_paye";
}

export interface SituationParDossier {
  dossier: string;
  dossierNumero?: string;
  totalFacture: number;
  totalPaye: number;
  resteAPayer: number;
}

/**
 * Regroupe des lignes financières et des paiements par dossier, pour
 * alimenter des vues transverses (dashboard de pilotage, "Recouvrement
 * Urgent"). Import différé des types pour éviter une dépendance circulaire.
 */
export function regrouperParDossier(
  lignes: { dossier: string; dossier_numero?: string; montant: number }[],
  paiements: { dossier: string; dossier_numero?: string; montant: number }[]
): SituationParDossier[] {
  const parDossier = new Map<string, SituationParDossier>();

  const obtenir = (dossier: string, dossierNumero?: string): SituationParDossier => {
    const existant = parDossier.get(dossier);
    if (existant) {
      if (!existant.dossierNumero && dossierNumero) existant.dossierNumero = dossierNumero;
      return existant;
    }
    const nouveau: SituationParDossier = {
      dossier,
      dossierNumero,
      totalFacture: 0,
      totalPaye: 0,
      resteAPayer: 0,
    };
    parDossier.set(dossier, nouveau);
    return nouveau;
  };

  for (const ligne of lignes) {
    obtenir(ligne.dossier, ligne.dossier_numero).totalFacture += parseMontant(ligne.montant);
  }
  for (const paiement of paiements) {
    obtenir(paiement.dossier, paiement.dossier_numero).totalPaye += parseMontant(paiement.montant);
  }

  return Array.from(parDossier.values()).map((situation) => ({
    ...situation,
    resteAPayer: Math.max(situation.totalFacture - situation.totalPaye, 0),
  }));
}
