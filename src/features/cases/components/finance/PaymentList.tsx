import { Button } from "../../../../shared/components/ui/Button/Button";
import { formatCurrency } from "../../helpers/format";
import type { Payment } from "../../types/finance.types";

interface PaymentListProps {
  payments: Payment[];
  onAddPayment: () => void;
  canCreate?: boolean;
}

export const PaymentList = ({ payments, onAddPayment, canCreate = true }: PaymentListProps) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-slate-900">Versements Reçus</h3>
        {canCreate && (
          <Button variant="secondary" onClick={onAddPayment} className="text-xs font-bold text-emerald-600 bg-transparent hover:!bg-transparent">
            + Enregistrer
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {payments.map((payment) => (
          <div key={payment.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <div>
              <span className="text-sm font-medium text-slate-800 capitalize">Versement</span>
              <span className="text-xs text-slate-400 ml-2">{payment.date_paiement}</span>
              <span className="text-xs text-slate-400 ml-2 uppercase font-mono bg-emerald-50 text-emerald-700 px-1 rounded">{payment.mode}</span>
              {payment.reference && <span className="text-xs text-slate-400 ml-2 italic">({payment.reference})</span>}
            </div>
            <span className="text-sm font-semibold text-emerald-600">+{formatCurrency(payment.montant)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};