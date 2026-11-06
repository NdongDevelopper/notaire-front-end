import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/ui/Button/Button';
import { api } from '../../../shared/services/api';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import type { Dossier, TypeActe } from '../types/case';

interface CasesPageProps {
  onCreateClick: () => void;
  onOpenClick: (id: string) => void;
  refreshTrigger?: boolean; 
}

export const CasesPage = ({ onCreateClick, onOpenClick, refreshTrigger }: CasesPageProps) => {
  const [cases, setCases] = useState<Dossier[]>([]);
  const [typesActes, setTypesActes] = useState<TypeActe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { can, loading: permissionsLoading } = usePermissions();

  // Fonction pour récupérer les dossiers et les types d'actes
  const fetchDossiersFromDB = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer les types d'actes en parallèle
      const [dossiersRes, typesRes] = await Promise.all([
        api.get('/dossiers/'),
        api.get('/types-actes/')
      ]);
      
      // Traiter les dossiers
      const dossiersData = Array.isArray(dossiersRes.data) 
        ? dossiersRes.data 
        : (dossiersRes.data as any).results || [];
      
      // Traiter les types d'actes
      const typesData = Array.isArray(typesRes.data) 
        ? typesRes.data 
        : (typesRes.data as any).results || [];
      
      setCases(dossiersData);
      setTypesActes(typesData);
    } catch (err: any) {
      console.error("Erreur lors de la récupération des dossiers :", err);
      setError("Impossible de charger les dossiers depuis la base de données.");
    } finally {
      setLoading(false);
    }
  };

  // Charge les dossiers au montage du composant et à chaque changement de déclencheur
  useEffect(() => {
    fetchDossiersFromDB();
  }, [refreshTrigger]);

  // Fonction utilitaire pour récupérer le libellé du type d'acte à partir de l'ID
  const getTypeActeLibelle = (typeActeId: number | TypeActe): string => {
    // Si c'est déjà un objet avec libelle
    if (typeof typeActeId === 'object' && typeActeId !== null) {
      return (typeActeId as TypeActe).libelle || `Acte #${(typeActeId as TypeActe).id}`;
    }
    
    // Si c'est un nombre (ID), chercher dans la liste des types
    if (typeof typeActeId === 'number') {
      const found = typesActes.find(t => t.id === typeActeId);
      return found?.libelle || `Acte #${typeActeId}`;
    }
    
    return `Acte #${typeActeId}`;
  };

  // Fonction pour obtenir la couleur de la priorité
  const getPriorityColor = (priorite: string): string => {
    switch (priorite) {
      case 'haute':
        return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'normale':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      default:
        return 'bg-slate-50 text-slate-500 border border-slate-100';
    }
  };

  // Fonction pour obtenir le libellé de la priorité
  const getPriorityLabel = (priorite: string): string => {
    switch (priorite) {
      case 'haute':
        return 'Haute';
      case 'normale':
        return 'Normale';
      default:
        return priorite || 'Basse';
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (statut: string): string => {
    const statusMap: Record<string, string> = {
      'ouvert': 'bg-blue-50 text-blue-600 border border-blue-100',
      'pieces_en_cours': 'bg-blue-50 text-blue-600 border border-blue-100',
      'en_redaction': 'bg-purple-50 text-purple-600 border border-purple-100',
      'validation': 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      'signature': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      'formalites': 'bg-amber-50 text-amber-600 border border-amber-100',
      'cloture': 'bg-green-50 text-green-600 border border-green-100',
      'archive': 'bg-slate-100 text-slate-500 border border-slate-200',
    };
    return statusMap[statut] || 'bg-slate-50 text-slate-500 border border-slate-100';
  };

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (statut: string): string => {
    const statusMap: Record<string, string> = {
      'ouvert': 'Ouvert',
      'pieces_en_cours': 'Pièces en cours',
      'en_redaction': 'En rédaction',
      'validation': 'Validation',
      'signature': 'Signature',
      'formalites': 'Formalités',
      'cloture': 'Clôture',
      'archive': 'Archive',
    };
    return statusMap[statut] || statut || 'Inconnu';
  };

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      {/* En-tête flexible */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Répertoire des Dossiers</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Liste exhaustive des dossiers notariaux de l'étude.</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={fetchDossiersFromDB}
            className="w-fit px-4 py-2 rounded-xl text-slate-600 bg-white border border-slate-200 shadow-sm text-center font-medium"
            disabled={loading}
          >
            {loading ? "🔄" : "Rafraîchir"}
          </Button>

          {!permissionsLoading && can('creer', 'dossier') && (
            <Button
              variant="primary"
              onClick={onCreateClick}
              className="w-fit px-4 py-2 rounded-xl shadow-sm text-center shrink-0 hover:!bg-blue-700"
            >
              + Créer un dossier
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Tableau responsive */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                <th className="py-4 px-6">ID unique / Objet</th>
                <th className="py-4 px-4">Type d'acte</th>
                <th className="py-4 px-4">Priorité</th>
                <th className="py-4 px-4">Statut</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && cases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm font-medium text-slate-500">
                    Connexion à la base de données...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm font-medium text-slate-400">
                    Aucun dossier enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                cases.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-b border-slate-50 last:border-none text-sm hover:bg-slate-50/40 transition-colors whitespace-nowrap"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 truncate max-w-[220px]" title={item.objet}>
                        {item.objet}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono font-medium truncate max-w-[220px]">
                        {item.id}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-600">
                      {getTypeActeLibelle(item.type_acte)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getPriorityColor(item.priorite)}`}>
                        {getPriorityLabel(item.priorite)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide inline-block ${getStatusColor(item.statut)}`}>
                        {getStatusLabel(item.statut)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        variant="secondary"
                        onClick={() => onOpenClick(String(item.id))}
                        className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:!bg-blue-100 border border-blue-100 rounded-lg shadow-sm"
                      >
                        Ouvrir
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};