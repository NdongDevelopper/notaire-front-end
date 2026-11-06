import React, { useState } from 'react';
import { FileText, MoreVertical } from 'lucide-react';
import { ActeActionsDropdown } from './ActeActionsDropdown';

interface DocumentType {
  id: string;
  title: string;
  steps: number;
  documents: number;
}

interface Props {
  type: DocumentType;
  onEdit: (type: DocumentType) => void;
  onDelete: (type: DocumentType) => void;
  onConfigure: (type: DocumentType) => void;
}

export const DocumentTypeCard: React.FC<Props> = ({ type, onEdit, onDelete, onConfigure }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col">
      <div className="flex justify-between items-start mb-4 relative">
        <div className="p-2 bg-blue-50 rounded-lg text-activeBtn">
          <FileText size={24} />
        </div>

        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-400 hover:text-text p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
          <MoreVertical size={20} />
        </button>

        {isMenuOpen && <ActeActionsDropdown onClose={() => setIsMenuOpen(false)} onEdit={() => onEdit(type)} onDelete={() => onDelete(type)} />}
      </div>

      <div className="flex-1">
        <h3 className="text-base font-bold text-text mb-1">{type.title}</h3>
        <p className="text-sm text-text-muted mb-6">
          {type.steps} étapes • {type.documents} documents requis
        </p>
      </div>

      <button
        onClick={() => onConfigure(type)}
        className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-text font-semibold text-sm rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
      >
        Configurer Workflow
      </button>
    </div>
  );
};
