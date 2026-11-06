import { Button } from "../../../../shared/components/ui/Button/Button";
import { formatCurrency } from "../../helpers/format";
import type { Invoice } from "../../types/finance.types";

interface InvoiceListProps {
  invoices: Invoice[];
  totalAmount: number;
  onAddInvoice: () => void;
  canCreate?: boolean;
}

export const InvoiceList = ({ invoices, totalAmount, onAddInvoice, canCreate = true }: InvoiceListProps) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-bold text-slate-900">Facturation & Débours</h3>
        {canCreate && (
          <Button variant="secondary" onClick={onAddInvoice} className="text-xs font-bold text-blue-600 bg-transparent hover:!bg-transparent">
            + Ajouter
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <div>
              <span className="text-sm font-medium text-slate-800">{invoice.libelle}</span>
              <span className="text-xs text-slate-400 ml-2 uppercase bg-slate-100 px-1.5 py-0.5 rounded">{invoice.categorie}</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">{formatCurrency(invoice.montant)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center border-t border-slate-100 pt-4 font-bold text-slate-900 text-sm mt-4">
        <span>TOTAL DOSSIER</span>
        <span>{formatCurrency(totalAmount)}</span>
      </div>
    </div>
  );
};