import { formatCurrency } from "../../helpers/format";

interface FinanceSummaryProps {
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
}

export const FinanceSummary = ({
  totalAmount,
  totalPaid,
  remainingAmount,
}: FinanceSummaryProps) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Résumé Financier</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium">Total facturé</span>
          <span className="font-semibold text-slate-800">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium">Total payé</span>
          <span className="font-semibold text-emerald-600">{formatCurrency(totalPaid)}</span>
        </div>
        <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-900">Reste à payer</span>
          <span className={`text-base font-bold ${remainingAmount <= 0 ? "text-emerald-600" : "text-amber-600"}`}>
            {formatCurrency(remainingAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};