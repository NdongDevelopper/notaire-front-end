import React from 'react';
import { Badge } from './Badge';
import type { RecentCase } from '../types/dashboard';
import { useNavigate} from "react-router-dom";

interface RecentCasesProps {
  cases: RecentCase[];
}

export const RecentCases: React.FC<RecentCasesProps> = ({ cases }) => {

  const navigate = useNavigate();
  // Fonction utilitaire interne pour formater la date en français (JJ/MM/AAAA)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs flex flex-col h-full">
      {/* En-tête du bloc */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold text-text">Derniers Dossiers</h2>
        <button
          type="button"
          className="text-xs font-semibold text-activeBtn hover:underline cursor-pointer"
          onClick={() => {
            navigate('/dashboard/dossiers');
          }}
        >
          Voir tout
        </button>
      </div>

      {/* Liste des dossiers */}
      <div className="space-y-4 flex-1">
        {cases.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-slate-400">Aucun dossier récent.</div>
        ) : (
          cases.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50/50 transition-colors border border-transparent hover:border-slate-100">
              {/* Partie gauche : Icône de type + Informations */}
              <div className="flex items-center gap-4">
                {/* Icône de la première lettre du type (ex: 'V' pour Vente) */}
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm select-none">{item.type.charAt(0).toUpperCase()}</div>

                {/* Textes de description */}
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text tracking-tight">{item.id}</span>
                  <span className="text-xs text-text-muted mt-0.5 font-normal">
                    {item.type} • Créé le {formatDate(item.createdAt)}
                  </span>
                </div>
              </div>

              {/* Partie droite : Le Badge de statut */}
              <div>
                <Badge status={item.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
