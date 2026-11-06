import { useState } from "react";
import { Modal } from "../../../../shared/components/ui/Modal/Modal";
import { Button } from "../../../../shared/components/ui/Button/Button";
import { Input } from "../../../../shared/components/ui/Input/Input";

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (invoice: { categorie: string; montant: string; libelle: string }) => void;
}

export const AddInvoiceModal = ({ isOpen, onClose, onAdd }: AddInvoiceModalProps) => {
  const [categorie, setCategorie] = useState("honoraires");
  const [montant, setMontant] = useState("");
  const [libelle, setLibelle] = useState("");

  const handleSubmit = () => {
    if (!montant.trim()) return;
    onAdd({ categorie, montant, libelle });
    setCategorie("honoraires");
    setMontant("");
    setLibelle("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter une ligne financière"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="hover:!bg-slate-200">
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="hover:!bg-blue-700">
            Ajouter
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Catégorie
          </label>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm"
          >
            <option value="honoraires">Honoraires</option>
            <option value="debours">Débours</option>
            <option value="droits_taxes">Droits et taxes</option>
          </select>
        </div>
        <Input
          label="Montant (FCFA)"
          type="number"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder="Ex: 500000"
        />
        <Input
          label="Libellé / Description"
          type="text"
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          placeholder="Ex: Honoraires rédaction acte"
        />
      </div>
    </Modal>
  );
};