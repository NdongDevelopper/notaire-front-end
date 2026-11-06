import { X } from 'lucide-react';

interface HelpCentreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactStudy?: () => void;
}

// Built as a self-contained modal rather than wrapping the shared
// Modal.tsx primitive — I don't have that component's prop signature
// yet. If your shared/components/ui/Modal/Modal.tsx exposes an
// isOpen/onClose/children API, swap the outer <div> wrapper below for
// <Modal isOpen={isOpen} onClose={onClose}> and drop the backdrop/close
// button markup, since Modal likely already provides it.
export function HelpCentreModal({ isOpen, onClose, onContactStudy }: HelpCentreModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50" onClick={onClose} />

      <div className="relative bg-white rounded-3xl border border-slate-100 shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-8 pb-4 shrink-0">
          <div>
            <h4 className="font-extrabold text-slate-900 text-lg">Centre de support & d'aide</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Trouvez des réponses claires sur le fonctionnement de l'étude notariale.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable FAQ body */}
        <div className="overflow-y-auto px-8 space-y-6 text-xs text-slate-600 leading-relaxed">
          <div>
            <h5 className="font-extrabold text-slate-900 text-sm mb-1">Questions Fréquentes (FAQ)</h5>
            <p className="text-slate-500">Comprendre le processus de rédaction et d'instruction de vos actes.</p>
          </div>

          <div className="space-y-1.5">
            <p className="font-bold text-slate-900 text-sm">1. Quel est le délai d'instruction d'une vente immobilière ?</p>
            <p>
              Le délai moyen au Sénégal varie entre 45 et 90 jours. Cela inclut la collecte de l'ensemble des pièces
              d'urbanisme, l'obtention du certificat de situation juridique au niveau des impôts et domaines, ainsi
              que l'examen cadastral.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="font-bold text-slate-900 text-sm">2. Pourquoi certaines pièces m'ont été rejetées ?</p>
            <p>
              Le notaire est garant de la sécurité juridique absolue de l'acte. Si une pièce d'identité est expirée,
              floue, ou si un document d'urbanisme présente des incohérences de nom, nous sommes légalement
              contraints de refuser le document et de demander un original certifié.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="font-bold text-slate-900 text-sm">3. À quoi servent les provisions de frais demandées ?</p>
            <p>
              Les provisions ne constituent pas uniquement nos honoraires. Elles servent majoritairement à régler
              pour votre compte les taxes de l'État (droits d'enregistrement fiscaux de 5%, timbres, frais
              d'inscription foncière) et les frais administratifs annexes (les débours).
            </p>
          </div>

          <div className="space-y-1.5 pb-6">
            <p className="font-bold text-slate-900 text-sm">4. Comment s'organise la signature de l'acte ?</p>
            <p>
              Une fois le projet d'acte approuvé par l'ensemble des parties et le solde des provisions reçu, notre
              secrétariat planifie une séance physique obligatoire à l'étude. Me Bineta Diouf fera la lecture
              solennelle de l'acte avant signature.
            </p>
          </div>
        </div>

        <div className="p-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4 text-xs shrink-0">
          <div>
            <p className="font-bold text-slate-900">Besoin d'un accompagnement personnalisé ?</p>
            <p className="text-slate-500 mt-0.5">
              Nos collaborateurs sont à votre entière disposition du lundi au vendredi de 8h à 18h.
            </p>
          </div>
          <button
            onClick={() => {
              onClose();
              onContactStudy?.();
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            Contacter l'Étude
          </button>
        </div>
      </div>
    </div>
  );
}

export default HelpCentreModal;
