import { DocumentRow } from "./DocumentRow";
import type { DocumentWithStatus } from "../../types/document.types";

interface DocumentsTableProps {
  documents: DocumentWithStatus[];
  onUploadDocument: (docId: string) => void;
  onDownloadDocument: (docId: string) => void;
  onShareDocument?: (docId: string) => void;
  onMarkActeSigne?: (docId: string) => void;
  onChangeStatus?: (docId: string, statut: string) => void;
  canModify?: boolean;
}

export const DocumentsTable = ({
  documents,
  onUploadDocument,
  onDownloadDocument,
  onShareDocument,
  onMarkActeSigne,
  onChangeStatus,
  canModify = true,
}: DocumentsTableProps) => {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-medium text-slate-400 italic">Aucune pièce dans ce dossier.</p>
        <p className="text-xs text-slate-300 mt-1">Cliquez sur "+ Ajouter une pièce" pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[500px]">
        <thead>
          <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <th className="py-4 px-6">Désignation de la pièce</th>
            <th className="py-4 px-4">Statut</th>
            <th className="py-4 px-4">Date Réception</th>
            <th className="py-4 px-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              document={doc}
              onUploadDocument={onUploadDocument}
              onDownloadDocument={onDownloadDocument}
              onShareDocument={onShareDocument}
              onMarkActeSigne={onMarkActeSigne}
              onChangeStatus={onChangeStatus}
              canModify={canModify}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};