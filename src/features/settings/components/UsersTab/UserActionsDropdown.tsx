import React, { useEffect, useRef } from 'react';
import { Edit2, Key, Trash2 } from 'lucide-react';

interface UserActionsDropdownProps {
  onClose: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
  isProtected: boolean;
}

export const UserActionsDropdown: React.FC<UserActionsDropdownProps> = ({ onClose, onEdit, onResetPassword, onDelete, isProtected }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        <span>Modifier le compte</span>
      </button>

      <button
        onClick={() => {
          onResetPassword();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text hover:bg-slate-50 transition-colors cursor-pointer text-left border-b border-slate-50 pb-2.5"
      >
        <Key size={16} className="text-text-muted" />
        <span>Réinitialiser le passe</span>
      </button>

      {!isProtected && (
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 transition-colors cursor-pointer text-left mt-1.5"
        >
          <Trash2 size={16} className="text-red-500" />
          <span className="font-medium">Supprimer le compte</span>
        </button>
      )}
    </div>
  );
};
