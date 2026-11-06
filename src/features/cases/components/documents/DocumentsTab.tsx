import { Plus } from "lucide-react";
import { Button } from "../../../../shared/components/ui/Button/Button";
import { DocumentsTable } from "./DocumentsTable";
import type { DocumentWithStatus } from "../../types/document.types";

interface DocumentsTabProps {
  documents: DocumentWithStatus[];
  checklistItemsLength: number;
  onAddDocument: () => void;
  onUploadDocument: (docId: string) => void;
  onDownloadDocument: (docId: string) => void;
  onShareDocument?: (docId: string) => void;
  onMarkActeSigne?: (docId: string) => void;
  onChangeStatus?: (docId: string, statut: string) => void;
  canCreate?: boolean;
  canModify?: boolean;
  canView?: boolean;
}

export const DocumentsTab = ({
  documents,
  checklistItemsLength,
  onAddDocument,
  onUploadDocument,
  onDownloadDocument,
  onShareDocument,
  onMarkActeSigne,
  onChangeStatus,
  canCreate = true,
  canModify = true,
  canView = true,
}: DocumentsTabProps) => {
  // La complétude du dossier (CDC §11) porte sur la checklist attendue, pas sur
  // les pièces ajoutées manuellement en plus (bouton "Ajouter une pièce", hors
  // checklist) — sinon une pièce ad-hoc fausse le pourcentage affiché.
  const checklistDocuments = checklistItemsLength > 0
    ? documents.filter((d) => Boolean(d.nom_checklist))
    : documents;
  const horsChecklistCount = documents.length - checklistDocuments.length;

  const receivedCount = checklistDocuments.filter(
    (d) => d.statut_calcule === 'recu' || d.statut_calcule === 'a_verifier' || d.statut_calcule === 'valide'
  ).length;

  if (!canView) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
        <p className="text-sm font-medium text-slate-500">
          Vous n'avez pas les permissions nécessaires pour consulter les pièces de ce dossier.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center">
        <div>
          <span className="text-sm font-medium text-slate-600">
            {checklistItemsLength > 0 ? "Checklist des pièces" : "Pièces du dossier"}
          </span>
          {checklistDocuments.length > 0 && (
            <span className="ml-2 text-xs text-slate-400">
              {receivedCount} / {checklistDocuments.length} reçues
            </span>
          )}
          {horsChecklistCount > 0 && (
            <span className="ml-2 text-xs text-slate-400">
              (+ {horsChecklistCount} hors checklist)
            </span>
          )}
        </div>
        {canCreate && (
          <Button
            variant="secondary"
            onClick={onAddDocument}
            className="text-xs font-bold text-blue-600 bg-transparent hover:!bg-transparent flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter une pièce
          </Button>
        )}
      </div>
      <DocumentsTable
        documents={documents}
        onUploadDocument={onUploadDocument}
        onDownloadDocument={onDownloadDocument}
        onShareDocument={onShareDocument}
        onMarkActeSigne={onMarkActeSigne}
        onChangeStatus={onChangeStatus}
        canModify={canModify || canCreate}
      />
      {checklistDocuments.length > 0 && checklistItemsLength > 0 && (
        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            <span className="font-medium">Complétude du dossier :</span>{' '}
            {receivedCount} / {checklistDocuments.length} pièces
            {checklistDocuments.filter((d) => d.obligatoire && d.statut_calcule === 'manquant').length > 0 && (
              <span className="ml-2 text-red-500">
                ({checklistDocuments.filter((d) => d.obligatoire && d.statut_calcule === 'manquant').length} obligatoire(s) manquant(s))
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};