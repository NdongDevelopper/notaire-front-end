import React from 'react';
import type { CaseStatus } from '../types/dashboard';

interface BadgeProps {
  status: CaseStatus;
}

const statusStyles: Record<CaseStatus, string> = {
  Actif: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
  'Pièces en cours': 'bg-amber-50 text-amber-700 border-amber-200/50',
  'À récupérer': 'bg-blue-50 text-blue-700 border-blue-200/50',
  'En retard': 'bg-rose-50 text-rose-700 border-rose-200/50',
};

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const currentStyle = statusStyles[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${currentStyle}`}>{status}</span>;
};
