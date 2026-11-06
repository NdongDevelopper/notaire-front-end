import React from 'react';
import type { ActivityLog } from '../types/dashboard';

interface ActivityLogPanelProps {
  activities: ActivityLog[];
}

export const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({ activities }) => {
  // Utilitaire pour afficher l'heure et la date de l'action
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs flex flex-col h-full">
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-text">Journal d'activité</h2>
      </div>

      {/* Contenu dynamique ou État vide */}
      <div className="flex-1 flex flex-col">
        {activities.length === 0 ? (
          // L'état vide exactement comme sur ta maquette
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <p className="text-sm italic text-slate-400 font-normal">Aucune activité récente.</p>
          </div>
        ) : (
          // S'il y a des données, on affiche une liste (Timeline basique)
          <div className="space-y-4">
            {activities.map((log) => (
              <div key={log.id} className="flex gap-3 text-sm">
                {/* Petit point de timeline visuel */}
                <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-200 shrink-0" />

                <div className="flex flex-col">
                  <span className="font-medium text-text">{log.action}</span>
                  <span className="text-xs text-text-muted mt-0.5">{formatDateTime(log.date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
