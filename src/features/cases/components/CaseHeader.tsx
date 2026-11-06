import { LogOut, Pencil, Trash2 } from "lucide-react";
import type { CaseStatus } from "../types/case";

interface CaseHeaderProps {
  caseId: string;
  caseType: string;
  status: CaseStatus;
  onStatusChange: (status: CaseStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const CaseHeader = ({
  caseId,
  caseType,
  status,
  onStatusChange,
  onEdit,
  onDelete,
  onBack,
  canEdit = true,
  canDelete = true,
}: CaseHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 md:gap-4">
        <button onClick={onBack} className="text-slate-600 hover:text-slate-900 transition-colors p-1">
          <LogOut className="w-5 h-5 rotate-180" />
        </button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight break-all">{caseId}</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Dossier de {caseType}</p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 flex-wrap">
        <span className="px-3 py-1 rounded-full text-xs font-semibold border uppercase whitespace-nowrap bg-blue-50 text-blue-600 border-blue-100">
          {status}
        </span>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as CaseStatus)}
          disabled={!canEdit}
          className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="OUVERT">Ouvert</option>
          <option value="PIECES_EN_COURS">Pièces en cours</option>
          <option value="REDACTION">Rédaction</option>
          <option value="VALIDATION">Validation</option>
          <option value="SIGNATURE">Signature</option>
          <option value="FORMALITES">Formalités</option>
          <option value="CLOTURE">Clôture</option>
          <option value="ARCHIVE">Archive</option>
        </select>

        {canEdit && (
          <button
            onClick={onEdit}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
            title="Modifier le dossier"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors"
            title="Supprimer le dossier"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};