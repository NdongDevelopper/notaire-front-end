import { Download, Upload, Share2, ShieldCheck } from "lucide-react";
import type { DocumentWithStatus } from "../../types/document.types";

interface DocumentRowProps {
  document: DocumentWithStatus;
  onUploadDocument: (docId: string) => void;
  onDownloadDocument: (docId: string) => void;
  onShareDocument?: (docId: string) => void;
  onMarkActeSigne?: (docId: string) => void;
  onChangeStatus?: (docId: string, statut: string) => void;
  canModify?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  manquant: 'Manquant',
  recu: 'Reçu',
  a_verifier: 'À vérifier',
  valide: 'Validé',
  rejete: 'Rejeté',
  expiree: 'Expirée',
};

const STATUS_COLORS: Record<string, string> = {
  manquant: 'bg-amber-50 text-amber-600',
  recu: 'bg-blue-50 text-blue-600',
  a_verifier: 'bg-purple-50 text-purple-600',
  valide: 'bg-green-50 text-green-600',
  rejete: 'bg-red-50 text-red-600',
  expiree: 'bg-slate-100 text-slate-500',
};

export const DocumentRow = ({
  document,
  onUploadDocument,
  onDownloadDocument,
  onShareDocument,
  onMarkActeSigne,
  onChangeStatus,
  canModify = true,
}: DocumentRowProps) => {
  const isRealDocument = !String(document.id).startsWith('checklist-');
  const hasFile = Boolean((document as any).fichier);
  const statut = document.statut_calcule || (hasFile ? 'recu' : 'manquant');
  // "acte_signe" est la catégorie confirmée par le backend (DocumentSerializer).
  const estActeSigne = document.categorie === 'acte_signe';

  const statutColor = STATUS_COLORS[statut] || 'bg-amber-50 text-amber-600';
  const statutLabel = STATUS_LABELS[statut] || 'Manquant';

  return (
    <tr className="border-b border-slate-50 text-sm">
      <td className="py-4 px-6 font-semibold text-slate-800">
        {document.nom_checklist || document.nom || "Pièce sans nom"}
        {estActeSigne && (
          <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
            <ShieldCheck className="inline w-3 h-3 mr-0.5 -mt-0.5" /> Acte signé
          </span>
        )}
        {document.obligatoire && (
          <span className="ml-2 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Obligatoire</span>
        )}
        {!isRealDocument && (
          <span className="ml-2 text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">À créer</span>
        )}
        {isRealDocument && !document.nom_checklist && (
          <span className="ml-2 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Hors checklist</span>
        )}
      </td>
      <td className="py-4 px-4">
        {isRealDocument && hasFile && canModify && onChangeStatus ? (
          <select
            value={statut}
            onChange={(e) => onChangeStatus(String(document.id), e.target.value)}
            className={`px-2 py-1 rounded text-xs font-bold border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 ${statutColor}`}
            title="Marquer la pièce comme reçue, à vérifier, validée, rejetée ou expirée"
          >
            <option value="recu">Reçu</option>
            <option value="a_verifier">À vérifier</option>
            <option value="valide">Validé</option>
            <option value="rejete">Rejeté</option>
            <option value="expiree">Expirée</option>
          </select>
        ) : (
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${statutColor}`}>{statutLabel}</span>
        )}
      </td>
      <td className="py-4 px-4 text-slate-500">
        {document.created_at ? new Date(document.created_at).toLocaleDateString('fr-FR') : '-'}
      </td>
      <td className="py-4 px-6 text-right">
        <div className="flex items-center justify-end gap-2">
          {isRealDocument && hasFile && (
            <button
              onClick={() => onDownloadDocument(String(document.id))}
              className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5" /> Télécharger
            </button>
          )}
          {isRealDocument && hasFile && onShareDocument && (
            <button
              onClick={() => onShareDocument(String(document.id))}
              className="text-purple-600 hover:text-purple-800 flex items-center gap-1 text-xs font-bold"
            >
              <Share2 className="w-3.5 h-3.5" /> Partager
            </button>
          )}
          {isRealDocument && hasFile && canModify && !estActeSigne && onMarkActeSigne && (
            <button
              onClick={() => onMarkActeSigne(String(document.id))}
              className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 text-xs font-bold"
              title="Déclare le document comme acte signé — déclenche le scellement d'intégrité côté serveur"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Marquer acte signé
            </button>
          )}
          {canModify && (
            <button
              onClick={() => onUploadDocument(String(document.id || ''))}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-bold"
            >
              <Upload className="w-3.5 h-3.5" /> {hasFile ? "Remplacer" : "Téléverser"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};