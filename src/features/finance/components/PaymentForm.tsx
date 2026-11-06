// components/PaymentForm.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import {
  CATEGORIE_LABELS,
  CATEGORIES,
  MODES_PAIEMENT,
  MODE_LABELS,
} from "../types/finance";
import type { LigneFinanciereFormState } from "../types/invoice";
import { LIGNE_FINANCIERE_FORM_INITIAL } from "../types/invoice";
import type { PaiementFormState } from "../types/payment";
import { PAIEMENT_FORM_INITIAL } from "../types/payment";

type Onglet = "charge" | "paiement";

export interface DossierOption {
  id: string;
  numero?: string;
  intitule?: string;
}

interface PaymentFormProps {
  dossierId?: string;
  onAjouterLigne: (values: LigneFinanciereFormState & { dossierId?: string }) => Promise<void> | void;
  onEnregistrerPaiement: (values: PaiementFormState & { dossierId?: string }) => Promise<void> | void;
  disabled?: boolean;
  dossiersList?: DossierOption[];
}

export default function PaymentForm({
  dossierId,
  onAjouterLigne,
  onEnregistrerPaiement,
  disabled = false,
  dossiersList = [],
}: PaymentFormProps) {
  const [onglet, setOnglet] = useState<Onglet>("charge");
  const [ligne, setLigne] = useState<LigneFinanciereFormState>(LIGNE_FINANCIERE_FORM_INITIAL);
  const [paiement, setPaiement] = useState<PaiementFormState>(PAIEMENT_FORM_INITIAL);
  
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const activeDossierId = dossierId || selectedDossierId;

  const montantValide = (valeur: string) => {
    const nombre = Number(valeur.replace(",", "."));
    return Number.isFinite(nombre) && nombre > 0;
  };

  async function soumettreLigne(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (!activeDossierId) {
      setErreur("Veuillez sélectionner un dossier.");
      return;
    }
    if (!ligne.categorie) {
      setErreur("Sélectionnez une catégorie.");
      return;
    }
    if (!ligne.libelle.trim()) {
      setErreur("Le libellé est obligatoire.");
      return;
    }
    if (!montantValide(ligne.montant)) {
      setErreur("Le montant doit être un nombre positif.");
      return;
    }

    try {
      setSubmitting(true);
      await onAjouterLigne({ ...ligne, dossierId: activeDossierId });
      setLigne(LIGNE_FINANCIERE_FORM_INITIAL);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'ajout de la charge.");
    } finally {
      setSubmitting(false);
    }
  }

  async function soumettrePaiement(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (!activeDossierId) {
      setErreur("Veuillez sélectionner un dossier.");
      return;
    }
    if (!montantValide(paiement.montant)) {
      setErreur("Le montant doit être un nombre positif.");
      return;
    }
    if (!paiement.date_paiement) {
      setErreur("La date de paiement est obligatoire.");
      return;
    }
    if (!paiement.mode) {
      setErreur("Choisissez un mode de paiement.");
      return;
    }

    try {
      setSubmitting(true);
      await onEnregistrerPaiement({ ...paiement, dossierId: activeDossierId });
      setPaiement(PAIEMENT_FORM_INITIAL);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'enregistrement du paiement.");
    } finally {
      setSubmitting(false);
    }
  }

  const isDisabled = disabled || submitting;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Sélecteur de dossier affiché si on est sur la vue globale du module comptabilité */}
      {!dossierId && (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-700">Dossier concerné *</label>
          <select
            value={selectedDossierId}
            onChange={(e) => setSelectedDossierId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            disabled={isDisabled}
          >
            <option value="">-- Sélectionner un dossier --</option>
            {dossiersList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.numero ? `Dossier ${d.numero}` : ""} {d.intitule ? `- ${d.intitule}` : `(${d.id.slice(0, 8)})`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setOnglet("charge")}
          className={`flex-1 rounded-md py-1.5 transition-colors ${
            onglet === "charge" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          Ajouter une charge
        </button>
        <button
          type="button"
          onClick={() => setOnglet("paiement")}
          className={`flex-1 rounded-md py-1.5 transition-colors ${
            onglet === "paiement" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          Enregistrer un paiement
        </button>
      </div>

      {erreur && (
        <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {erreur}
        </p>
      )}

      {onglet === "charge" ? (
        <form onSubmit={soumettreLigne} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Catégorie</label>
            <select
              value={ligne.categorie}
              onChange={(e) =>
                setLigne((prev) => ({ ...prev, categorie: e.target.value as typeof prev.categorie }))
              }
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              disabled={isDisabled}
            >
              <option value="">Sélectionner…</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORIE_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Libellé</label>
            <input
              type="text"
              value={ligne.libelle}
              onChange={(e) => setLigne((prev) => ({ ...prev, libelle: e.target.value }))}
              placeholder="Ex: Honoraires rédaction acte de vente"
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              disabled={isDisabled}
            />
          </div>

          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Montant (FCFA)</label>
            <input
              type="number"
              min={0}
              value={ligne.montant}
              onChange={(e) => setLigne((prev) => ({ ...prev, montant: e.target.value }))}
              placeholder="500000"
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              disabled={isDisabled}
            />
          </div>

          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={isDisabled}
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitting ? "Ajout en cours…" : "Ajouter la charge"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={soumettrePaiement} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Montant (FCFA)</label>
            <input
              type="number"
              min={0}
              value={paiement.montant}
              onChange={(e) => setPaiement((prev) => ({ ...prev, montant: e.target.value }))}
              placeholder="250000"
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              disabled={isDisabled}
            />
          </div>

          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Date de paiement</label>
            <input
              type="date"
              value={paiement.date_paiement}
              onChange={(e) => setPaiement((prev) => ({ ...prev, date_paiement: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              disabled={isDisabled}
            />
          </div>

          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Mode</label>
            <select
              value={paiement.mode}
              onChange={(e) =>
                setPaiement((prev) => ({ ...prev, mode: e.target.value as typeof prev.mode }))
              }
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              disabled={isDisabled}
            >
              <option value="">Sélectionner…</option>
              {MODES_PAIEMENT.map((mode) => (
                <option key={mode} value={mode}>
                  {MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Référence <span className="text-slate-400">(optionnel)</span>
            </label>
            <input
              type="text"
              value={paiement.reference}
              onChange={(e) => setPaiement((prev) => ({ ...prev, reference: e.target.value }))}
              placeholder="REF-001"
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              disabled={isDisabled}
            />
          </div>

          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={isDisabled}
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitting ? "Enregistrement…" : "Enregistrer le paiement"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}