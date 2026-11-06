export const STATUS_LABELS: Record<string, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
  en_retard: "En retard",
};

export const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status] || status;
};

export const getStatusColor = (statut: string): string => {
  switch (statut) {
    case 'termine':
      return 'bg-green-50 text-green-600 border-green-100';
    case 'en_cours':
      return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'a_faire':
      return 'bg-slate-50 text-slate-600 border-slate-100';
    case 'en_retard':
      return 'bg-red-50 text-red-600 border-red-100';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};