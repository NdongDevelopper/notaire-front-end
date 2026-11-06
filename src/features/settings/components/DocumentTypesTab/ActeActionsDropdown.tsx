import React, { useEffect, useRef } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface ActeActionsDropdownProps {
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ActeActionsDropdown: React.FC<ActeActionsDropdownProps> = ({ onClose, onEdit, onDelete }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Gestion du clic en dehors pour fermer le menu automatiquement
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={dropdownRef} className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-100 shadow-xl z-30 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
      <button
        onClick={() => {
          onEdit();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text hover:bg-slate-50 transition-colors cursor-pointer text-left"
      >
        <Edit2 size={16} className="text-text-muted" />
        <span>Modifier le type d'acte</span>
      </button>

      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 transition-colors cursor-pointer text-left mt-1"
      >
        <Trash2 size={16} className="text-red-500 " />
        <span className="font-medium whitespace-nowrap">Supprimer le type d'acte</span>
      </button>
    </div>
  );
};
