// components/PaymentTable.tsx
import type { LigneFinanciere } from "../types/invoice";
import { CATEGORIE_LABELS, formatMontantFCFA, parseMontant } from "../types/finance";

interface PaymentTableProps {
  lignes: LigneFinanciere[];
  loading?: boolean;
  onSupprimer?: (id: string) => void;
  peutModifier?: boolean;
}

/**
 * Tableau des charges facturées sur un dossier (honoraires, débours,
 * droits/taxes, frais administratifs, autres). Voir cahier des charges §15.
 */
export default function PaymentTable({
  lignes,
  loading = false,
  onSupprimer,
  peutModifier = false,
}: PaymentTableProps) {
  const total = lignes.reduce((somme, ligne) => somme + parseMontant(ligne.montant), 0);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />;
  }

  if (lignes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        Aucune charge n'a encore été ajoutée à ce dossier.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Catégorie</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Libellé</th>
              <th className="px-4 py-2 text-right font-medium text-slate-600">Montant</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Date</th>
              {peutModifier && <th className="px-4 py-2 text-right font-medium text-slate-600" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lignes.map((ligne) => (
              <tr key={ligne.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-2 text-slate-700">{CATEGORIE_LABELS[ligne.categorie]}</td>
                <td className="px-4 py-2 text-slate-700">{ligne.libelle}</td>
                <td className="px-4 py-2 text-right font-medium text-slate-900">
                  {formatMontantFCFA(ligne.montant)}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {(ligne.created_at ?? ligne.updated_at)
                    ? new Date(ligne.created_at ?? ligne.updated_at ?? "").toLocaleDateString("fr-FR")
                    : "—"}
                </td>
                {peutModifier && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onSupprimer?.(ligne.id)}
                      className="text-xs font-medium text-rose-600 hover:text-rose-800"
                    >
                      Supprimer
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr>
              <td className="px-4 py-2 font-semibold text-slate-700" colSpan={2}>
                Total facturé
              </td>
              <td className="px-4 py-2 text-right font-semibold text-slate-900">
                {formatMontantFCFA(total)}
              </td>
              <td colSpan={peutModifier ? 2 : 1} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
