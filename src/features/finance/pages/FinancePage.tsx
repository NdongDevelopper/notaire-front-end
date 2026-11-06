// pages/FinancePage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { caseService } from "../../cases/services/case.service";
import FinanceSummary from "../components/FinanceSummary";
import PaymentForm from "../components/PaymentForm";
import PaymentTable from "../components/PaymentTable";
import SettlementsTable from "../components/SettlementsTable";
import UrgentRecoveryPanel from "../components/UrgentRecoveryPanel";
import {
  creerLigneFinanciere,
  creerPaiement,
  listerLignesFinancieres,
  listerPaiements,
  obtenirSituationFinanciere,
  supprimerLigneFinanciere,
} from "../services/financeApi";
import type { LigneFinanciere, LigneFinanciereFormState } from "../types/invoice";
import type { Paiement, PaiementFormState, SituationFinanciere } from "../types/payment";
import {
  regrouperParDossier,
  parseMontant,
  libelleDossier,
  MODE_LABELS,
  formatMontantFCFA,
  deriveStatutFinancier,
  STATUT_LABELS,
} from "../types/finance";

interface FinancePageProps {
  dossierId?: string;
  peutModifier?: boolean;
  peutExporter?: boolean;
  onOuvrirDossier?: (dossierId: string) => void;
}

function normalizeDossierId(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized && normalized !== "undefined" && normalized !== "null" ? normalized : null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const candidate of [record.id, record.uuid, record.dossierId, record.dossier_id, record.dossier]) {
      const resolved = normalizeDossierId(candidate);
      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
}

export default function FinancePage({
  dossierId,
  peutModifier = true,
  peutExporter = true,
  onOuvrirDossier,
}: FinancePageProps) {
  const navigate = useNavigate();
  const [lignes, setLignes] = useState<LigneFinanciere[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [situationFinanciere, setSituationFinanciere] = useState<SituationFinanciere | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);

  const [dossiersListe, setDossiersListe] = useState<Array<{ id: string; numero?: string; intitule?: string }>>([]);

  const ensureArray = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (Array.isArray(obj.results)) return obj.results as T[];
      if (Array.isArray(obj.data)) return obj.data as T[];
      if (Array.isArray(obj.items)) return obj.items as T[];
    }
    return [];
  };

  const chargerDonnees = useCallback(async (afficherChargement = true) => {
    if (afficherChargement) {
      setLoading(true);
      setErreurChargement(null);
    }
    try {
      try {
        const dossiersData = await caseService.getDossiers();
        setDossiersListe(ensureArray(dossiersData));
      } catch (e) {
        console.warn("Impossible de charger la liste des dossiers", e);
      }

      if (dossierId) {
        try {
          const situation = await obtenirSituationFinanciere(dossierId);
          setSituationFinanciere(situation);
          const [lignesRes, paiementsRes] = await Promise.all([
            listerLignesFinancieres(dossierId),
            listerPaiements(dossierId),
          ]);
          setLignes(ensureArray<LigneFinanciere>(lignesRes));
          setPaiements(ensureArray<Paiement>(paiementsRes));
        } catch (situationError) {
          console.warn("Situation endpoint unavailable, using fallback:", situationError);
          const [lignesRes, paiementsRes] = await Promise.all([
            listerLignesFinancieres(dossierId),
            listerPaiements(dossierId),
          ]);
          setLignes(ensureArray<LigneFinanciere>(lignesRes));
          setPaiements(ensureArray<Paiement>(paiementsRes));
          setSituationFinanciere(null);
        }
      } else {
        const [lignesRes, paiementsRes] = await Promise.all([
          listerLignesFinancieres(),
          listerPaiements(),
        ]);
        setLignes(ensureArray<LigneFinanciere>(lignesRes));
        setPaiements(ensureArray<Paiement>(paiementsRes));
        setSituationFinanciere(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Impossible de charger les données financières.";
      if (afficherChargement) {
        setErreurChargement(errorMessage);
        setLignes([]);
        setPaiements([]);
      } else {
        console.warn("Impossible de synchroniser les données financières après l'enregistrement", err);
      }
    } finally {
      if (afficherChargement) {
        setLoading(false);
      }
    }
  }, [dossierId]);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  const honorairesTotal = useMemo(
    () => lignes.filter((l) => l.categorie === "honoraires").reduce((s, l) => s + parseMontant(l.montant), 0),
    [lignes]
  );
  const deboursTotal = useMemo(
    () => lignes.filter((l) => l.categorie === "debours").reduce((s, l) => s + parseMontant(l.montant), 0),
    [lignes]
  );
  const totalFacture = useMemo(() => {
    if (situationFinanciere?.total_facture !== undefined) {
      return parseMontant(situationFinanciere.total_facture);
    }
    return lignes.reduce((s, l) => s + parseMontant(l.montant), 0);
  }, [lignes, situationFinanciere]);
  const totalEncaisse = useMemo(() => {
    if (situationFinanciere?.total_paye !== undefined) {
      return parseMontant(situationFinanciere.total_paye);
    }
    return paiements.reduce((s, p) => s + parseMontant(p.montant), 0);
  }, [paiements, situationFinanciere]);
  const resteARecouvrer = Math.max(totalFacture - totalEncaisse, 0);
  const statutFinancier = useMemo(() => {
    if (situationFinanciere?.statut_financier) {
      return situationFinanciere.statut_financier;
    }
    return deriveStatutFinancier(totalFacture, totalEncaisse);
  }, [situationFinanciere, totalFacture, totalEncaisse]);
  const dossierLabel = useMemo(() => {
    const fromLine = lignes.find((ligne) => ligne.dossier_numero)?.dossier_numero;
    const fromPayment = paiements.find((paiement) => paiement.dossier_numero)?.dossier_numero;
    return fromLine ?? fromPayment ?? (dossierId ? `Dossier ${dossierId.slice(0, 8)}…` : "Vue étude");
  }, [dossierId, lignes, paiements]);
  const statutLabel = useMemo(() => {
    if (!statutFinancier) return "—";
    return statutFinancier in STATUT_LABELS
      ? STATUT_LABELS[statutFinancier as keyof typeof STATUT_LABELS]
      : statutFinancier;
  }, [statutFinancier]);

  const situationsParDossier = useMemo(
    () => regrouperParDossier(lignes, paiements),
    [lignes, paiements]
  );

  const paiementsTries = useMemo(
    () =>
      [...paiements].sort(
        (a, b) => new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime()
      ),
    [paiements]
  );

  const handleOuvrirDossier = useCallback(
    async (dossierRef: string | unknown) => {
      const fallbackRef = normalizeDossierId(dossierRef);
      if (!fallbackRef) {
        console.warn("Impossible d’ouvrir le dossier : identifiant introuvable", dossierRef);
        return;
      }

      let resolvedDossierId = fallbackRef;

      try {
        const dossiers = await caseService.getDossiers();
        const matchedDossier = dossiers.find((dossier) => {
          const dossierId = normalizeDossierId(dossier.id);
          const dossierNumero = normalizeDossierId(dossier.numero);
          return dossierId === fallbackRef || dossierNumero === fallbackRef;
        });

        if (matchedDossier?.id) {
          resolvedDossierId = String(matchedDossier.id);
        }
      } catch (error) {
        console.warn("Impossible de résoudre le dossier depuis la liste des dossiers", error);
      }

      if (onOuvrirDossier) {
        onOuvrirDossier(resolvedDossierId);
        return;
      }
      navigate(`/dashboard/dossiers/${encodeURIComponent(resolvedDossierId)}`);
    },
    [navigate, onOuvrirDossier]
  );

  async function handleAjouterLigne(values: LigneFinanciereFormState & { dossierId?: string }) {
    const targetDossierId = dossierId || values.dossierId;
    if (!targetDossierId || !values.categorie) return;
    try {
      const nouvelleLigne = await creerLigneFinanciere({
        dossier: targetDossierId,
        categorie: values.categorie,
        libelle: values.libelle.trim(),
        montant: Number(values.montant.replace(",", ".")),
      });
      setLignes((prev) => [...prev, nouvelleLigne]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Impossible d'ajouter la ligne financière.";
      setErreurChargement(errorMessage);
    }
  }

  async function handleEnregistrerPaiement(values: PaiementFormState & { dossierId?: string }) {
    const targetDossierId = dossierId || values.dossierId;
    if (!targetDossierId || !values.mode) return;
    try {
      const nouveauPaiement = await creerPaiement({
        dossier: targetDossierId,
        montant: Number(values.montant.replace(",", ".")),
        date_paiement: values.date_paiement,
        mode: values.mode,
        reference: values.reference || undefined,
      });

      // Affiche immédiatement la réponse du POST, puis réconcilie les totaux
      // et les autres listes avec l'API sans bloquer le formulaire ou le tableau.
      setPaiements((prev) => [nouveauPaiement, ...prev]);
      void chargerDonnees(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Impossible d'enregistrer le paiement.";
      setErreurChargement(errorMessage);
    }
  }
  async function handleSupprimerLigne(id: string) {
    const precedent = lignes;
    setLignes((prev) => prev.filter((l) => l.id !== id));
    try {
      await supprimerLigneFinanciere(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Impossible de supprimer la ligne financière.";
      setErreurChargement(errorMessage);
      setLignes(precedent);
    }
  }

  function handleExporterPdf() {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Rapport financier", pageWidth / 2, 48, { align: "center" });

      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text(`Établi le ${new Date().toLocaleDateString("fr-FR")}`, margin, 72);

      doc.setDrawColor(140, 140, 140);
      doc.setLineWidth(0.6);
      doc.line(margin, 88, pageWidth - margin, 88);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Liste des règlements", margin, 108);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const tableTop = 124;
      const col1 = margin;
      const col2 = 90;
      const col3 = 190;
      const col4 = 410;
      const rowHeight = 18;
      const usableWidth = pageWidth - margin * 2;

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.4);
      doc.rect(margin, tableTop, usableWidth, rowHeight);
      doc.text("Date", col1 + 4, tableTop + 12);
      doc.text("Dossier", col2 + 4, tableTop + 12);
      doc.text("Mode", col3 + 4, tableTop + 12);
      doc.text("Montant", col4 + 4, tableTop + 12);

      let y = tableTop + rowHeight;

      if (paiementsTries.length === 0) {
        doc.text("Aucun règlement enregistré.", margin + 4, y + 12);
      } else {
        paiementsTries.forEach((payment) => {
          if (y > pageHeight - margin - rowHeight) {
            doc.addPage();
            y = margin + 20;
          }

          const date = new Date(payment.date_paiement).toLocaleDateString("fr-FR");
          const dossierLabelText = libelleDossier(payment.dossier, payment.dossier_numero);
          const modeLabel = MODE_LABELS[payment.mode];
          const rawMontant = payment.montant ?? (payment as unknown as { amount?: number }).amount ?? 0;
          const montantText = formatMontantFCFA(rawMontant);

          const dossierText = doc.splitTextToSize(dossierLabelText, col3 - col2 - 8);
          const modeText = doc.splitTextToSize(modeLabel, col4 - col3 - 8);

          doc.rect(margin, y, usableWidth, rowHeight);
          doc.text(date, col1 + 4, y + 12);
          doc.text(dossierText[0] ?? "", col2 + 4, y + 12);
          doc.text(modeText[0] ?? "", col3 + 4, y + 12);
          doc.text(montantText, col4 + 4, y + 12);

          y += rowHeight;
        });
      }

      const fileName = `grand-livre-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF financier", error);
      setErreurChargement("Impossible d’exporter le PDF financier.");
    }
  }

  return (
    <div className="px-5 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {dossierId ? "Finances du dossier" : "Module Comptabilité"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {dossierId
            ? "Honoraires, débours, droits et taxes, frais administratifs et paiements de ce dossier."
            : "Suivi des honoraires, débours et règlements de l'étude."}
        </p>
      </div>

      {erreurChargement && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <svg className="h-6 w-6 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-rose-800">Erreur de chargement</h3>
              <p className="mt-2 text-sm text-rose-700">{erreurChargement}</p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setErreurChargement(null);
                    chargerDonnees();
                  }}
                  className="inline-flex items-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                >
                  Réessayer
                </button>
                <button
                  onClick={() => setErreurChargement(null)}
                  className="inline-flex items-center rounded-md border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 shadow-sm hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                >
                  Ignorer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!erreurChargement && (
        <>
          {dossierId && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">État financier synchronisé avec l’API</p>
                  <h3 className="text-lg font-semibold text-slate-900">{dossierLabel}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Total facturé {formatMontantFCFA(totalFacture)} • Total encaissé {formatMontantFCFA(totalEncaisse)}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                  {statutLabel}
                </span>
              </div>
            </div>
          )}

          <FinanceSummary
            honorairesTotal={honorairesTotal}
            deboursTotal={deboursTotal}
            totalEncaisse={totalEncaisse}
            resteARecouvrer={resteARecouvrer}
            loading={loading}
          />

          {peutModifier && (
            <PaymentForm
              dossierId={dossierId}
              dossiersList={dossiersListe}
              onAjouterLigne={handleAjouterLigne}
              onEnregistrerPaiement={handleEnregistrerPaiement}
            />
          )}

          {dossierId && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Charges facturées</h3>
              <PaymentTable
                lignes={lignes}
                loading={loading}
                onSupprimer={handleSupprimerLigne}
                peutModifier={peutModifier}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="printable">
              <SettlementsTable
                paiements={paiementsTries}
                loading={loading}
                onExporterPdf={handleExporterPdf}
                onOuvrirDossier={handleOuvrirDossier}
                peutExporter={peutExporter}
              />
            </div>
            {!dossierId && (
              <UrgentRecoveryPanel
                dossiers={situationsParDossier}
                loading={loading}
                onOuvrirDossier={handleOuvrirDossier}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}