import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmLabel?: string;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, description, variant = 'info', confirmLabel = 'Confirmer', isLoading = false }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <ShieldAlert size={24} className="text-red-600" />,
          iconBg: 'bg-red-50',
          btnClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-200 text-white',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={24} className="text-amber-600" />,
          iconBg: 'bg-amber-50',
          btnClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-200 text-white',
        };
      case 'info':
      default:
        return {
          icon: <Info size={24} className="text-activeBtn" />,
          iconBg: 'bg-blue-50',
          btnClass: 'bg-activeBtn hover:bg-blue-700 focus:ring-blue-100 text-white',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${styles.iconBg}`}>{styles.icon}</div>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-text-muted leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Barre d'actions responsive */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-slate-50 border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer ${styles.btnClass}`}
          >
            {isLoading ? 'Traitement...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
