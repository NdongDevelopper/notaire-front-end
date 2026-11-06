// components/ModelCard.tsx
import { Clock, Copy, FileText, Trash2 } from "lucide-react";
import { extraitContenu, formatDateFr, getModeleDate } from "../types/models";
import type { ModeleActe } from "../types/models";

interface ModelCardProps {
  modele: ModeleActe;
  typeLibelle?: string;
  onClick: () => void;
  /** Absent (undefined) => bouton "Dupliquer" masqué. Le contrôle du droit se
   * fait dans la page appelante (ModelsLibraryPage), pas ici. */
  onDuplicate?: (modele: ModeleActe) => void;
  /** Absent (undefined) => bouton "Supprimer" masqué. */
  onDelete?: (modele: ModeleActe) => void;
}

/**
 * Carte d'un modèle d'acte dans la Bibliothèque de Modèles: icône, badge de
 * catégorie, titre, aperçu du contenu et date de dernière mise à jour.
 */
export default function ModelCard({ modele, typeLibelle, onClick, onDuplicate, onDelete }: ModelCardProps) {
  const statut = modele.statut ?? "Brouillon";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <button type="button" onClick={onClick} className="flex items-center gap-3 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <FileText size={18} strokeWidth={2} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{modele.titre}</h3>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {typeLibelle ?? modele.type_acte}
            </p>
          </div>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
          {statut}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          v{modele.version ?? 1}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 flex-1 text-sm italic text-slate-500">
        {extraitContenu(modele.contenu)}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
          <Clock size={13} />
          {formatDateFr(getModeleDate(modele))}
        </div>
        {(onDuplicate || onDelete) && (
          <div className="flex items-center gap-2">
            {onDuplicate && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDuplicate(modele);
                }}
                className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                title="Dupliquer"
              >
                <Copy size={14} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(modele);
                }}
                className="rounded-md border border-rose-200 p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                title="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}