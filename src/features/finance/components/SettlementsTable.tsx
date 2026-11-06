// components/SettlementsTable.tsx
import { Plus } from "lucide-react";
import type { Paiement } from "../types/payment";
import { MODE_LABELS, formatMontantFCFA, libelleDossier } from "../types/finance";

interface SettlementsTableProps {
  paiements: Paiement[];
  loading?: boolean;
  onExporterPdf?: () => void;
  onOuvrirDossier?: (dossierId: string) => void;
  peutExporter?: boolean;
}


export default function SettlementsTable({
  paiements,
  loading = false,
  onExporterPdf,
  onOuvrirDossier,
  peutExporter = true,
}: SettlementsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-900">Grand Livre des Règlements</h3>
        {peutExporter && (
          <button
            type="button"
            onClick={onExporterPdf}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus size={16} />
            Exporter PDF
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 p-5">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-10 animate-pulse rounded-md bg-slate-100" />
          ))}
        </div>
      ) : paiements.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500">
          Aucun règlement enregistré pour le moment.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3">Dossier</th>
              <th className="px-5 py-3">Méthode</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-right">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paiements.map((paiement) => (
              <tr key={paiement.id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => onOuvrirDossier?.(paiement.dossier_numero ?? paiement.dossier)}
                    className="font-medium text-blue-600 underline-offset-2 hover:underline"
                  >
                    {libelleDossier(paiement.dossier, paiement.dossier_numero)}
                  </button>
                </td>
                <td className="px-5 py-3 text-slate-700">{MODE_LABELS[paiement.mode]}</td>
                <td className="px-5 py-3 text-slate-500">
                  {new Date(paiement.date_paiement).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-emerald-600">
                  {formatMontantFCFA(paiement.montant)}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
