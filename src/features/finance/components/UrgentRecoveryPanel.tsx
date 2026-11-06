// components/UrgentRecoveryPanel.tsx
import { AlertTriangle } from "lucide-react";
import type { SituationParDossier } from "../types/finance";
import { formatMontantFCFA, libelleDossier } from "../types/finance";

interface UrgentRecoveryPanelProps {
  dossiers: SituationParDossier[];
  loading?: boolean;
  maxItems?: number;
  onOuvrirDossier?: (dossierId: string) => void;
}

/**
 * Panneau "Recouvrement Urgent": met en évidence les dossiers avec le plus
 * gros reste à payer, pour guider les relances de l'étude.
 * Cahier des charges §6 (alertes paiement en attente) et §15.
 */
export default function UrgentRecoveryPanel({
  dossiers,
  loading = false,
  maxItems = 5,
  onOuvrirDossier,
}: UrgentRecoveryPanelProps) {
  const urgents = dossiers
    .filter((d) => d.resteAPayer > 0)
    .sort((a, b) => b.resteAPayer - a.resteAPayer)
    .slice(0, maxItems);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Recouvrement Urgent</h3>

      {loading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-12 animate-pulse rounded-md bg-slate-100" />
          ))}
        </div>
      ) : urgents.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Aucun dossier avec un reste à payer pour le moment.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {urgents.map((dossier) => (
            <li key={dossier.dossier}>
              <button
                type="button"
                onClick={() => onOuvrirDossier?.(dossier.dossier)}
                className="flex w-full items-start justify-between gap-3 rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2 text-left transition-colors hover:bg-rose-50"
              >
                <span className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-500" />
                  <span className="text-sm font-medium text-slate-800">
                    {libelleDossier(dossier.dossier, dossier.dossierNumero)}
                  </span>
                </span>
                <span className="whitespace-nowrap text-sm font-semibold text-rose-600">
                  {formatMontantFCFA(dossier.resteAPayer)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
