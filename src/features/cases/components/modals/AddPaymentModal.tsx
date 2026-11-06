import { useState } from "react";
import { Modal } from "../../../../shared/components/ui/Modal/Modal";
import { Button } from "../../../../shared/components/ui/Button/Button";
import { Input } from "../../../../shared/components/ui/Input/Input";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payment: { montant: string; date_paiement: string; mode: string; reference: string }) => void;
}

export const AddPaymentModal = ({ isOpen, onClose, onAdd }: AddPaymentModalProps) => {
  const [montant, setMontant] = useState("");
  const [datePaiement, setDatePaiement] = useState("");
  const [mode, setMode] = useState("virement");
  const [reference, setReference] = useState("");

  const handleSubmit = () => {
    if (!montant.trim()) return;
    onAdd({ montant, date_paiement: datePaiement, mode, reference });
    setMontant("");
    setDatePaiement("");
    setMode("virement");
    setReference("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enregistrer un paiement"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="hover:!bg-slate-200">
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="hover:!bg-blue-700">
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Montant (FCFA)"
          type="number"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder="Ex: 250000"
        />
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Date de paiement
          </label>
          <input
            type="date"
            value={datePaiement}
            onChange={(e) => setDatePaiement(e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Mode de paiement
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm"
          >
            <option value="especes">Espèces</option>
            <option value="cheque">Chèque</option>
            <option value="virement">Virement</option>
            <option value="mobile_money">Mobile Money</option>
          </select>
        </div>
        <Input
          label="Référence du paiement"
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Ex: REF-001"
        />
      </div>
    </Modal>
  );
};