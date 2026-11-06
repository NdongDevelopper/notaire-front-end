import { FinanceSummary } from "./FinanceSummary";
import { InvoiceList } from "./InvoiceList";
import { PaymentList } from "./PaymentList";
import type { Invoice, Payment } from "../../types/finance.types";

interface FinanceTabProps {
  invoices: Invoice[];
  payments: Payment[];
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  onAddInvoice: () => void;
  onAddPayment: () => void;
  canCreate?: boolean;
  canView?: boolean;
}

export const FinanceTab = ({
  invoices,
  payments,
  totalAmount,
  totalPaid,
  remainingAmount,
  onAddInvoice,
  onAddPayment,
  canCreate = true,
  canView = true,
}: FinanceTabProps) => {
  // CDC §15 : "Seuls associés et comptable modifient les finances" — et par
  // extension, ce sont les seuls "Utilisateurs concernés" par ce module, donc
  // les seuls à devoir voir des montants (données sensibles, cf §21 sécurité).
  if (!canView) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
        <p className="text-sm font-medium text-slate-500">
          Vous n'avez pas les permissions nécessaires pour consulter les finances de ce dossier.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-6">
        <InvoiceList invoices={invoices} totalAmount={totalAmount} onAddInvoice={onAddInvoice} canCreate={canCreate} />
        <PaymentList payments={payments} onAddPayment={onAddPayment} canCreate={canCreate} />
      </div>

      <div className="lg:col-span-4 space-y-4">
        <FinanceSummary
          totalAmount={totalAmount}
          totalPaid={totalPaid}
          remainingAmount={remainingAmount}
        />
      </div>
    </div>
  );
};