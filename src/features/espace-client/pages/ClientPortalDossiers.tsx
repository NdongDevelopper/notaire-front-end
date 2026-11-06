import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Search } from 'lucide-react';
import { PortalPageHeader } from '../components/PortalPageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useEspaceClientData } from '../context/EspaceClientDataContext';
import { PATHS } from '../../../routes/Paths';

export function ClientPortalDossiers() {
  const navigate = useNavigate();
  const { isLoading, myDossiers, unreadNotificationsCount } = useEspaceClientData();
  const [search, setSearch] = useState('');

  const filteredDossiers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return myDossiers;
    return myDossiers.filter(
      (d) => d.number.toLowerCase().includes(query) || d.type.toLowerCase().includes(query),
    );
  }, [myDossiers, search]);

  if (isLoading) {
    return <div className="p-4 sm:p-6 lg:p-8 text-sm text-slate-500">Chargement de vos dossiers...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PortalPageHeader
        title="Mes dossiers notariaux"
        subtitle="Retrouvez l'historique complet de vos dossiers en cours d'instruction."
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par numéro ou type de dossier..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDossiers.map((d) => {
          return (
            <div
              key={d.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    {/* Role badge removed from the list view — fetching every
                        dossier's parties just for this badge was the N+1 causing
                        slow page loads. See ClientPortalDossierDetail for the
                        per-dossier role, fetched lazily on that page instead. */}
                    <h4 className="text-xl font-extrabold text-slate-900 tracking-tight mt-2">{d.number}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{d.type} immobilière</p>
                  </div>
                  <StatusBadge status={d.clientStatus} />
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Progression globale</span>
                    <span className="font-bold text-slate-900">{d.progression || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-900 h-full" style={{ width: `${d.progression || 0}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 mt-6 pt-4 text-xs">
                <span className="text-slate-500">Mis à jour le {new Date(d.updatedAt).toLocaleDateString()}</span>
                <button
                  onClick={() => navigate(PATHS.espaceClientDossierDetails(d.id))}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  Voir mon dossier
                </button>
              </div>
            </div>
          );
        })}

        {filteredDossiers.length === 0 && myDossiers.length > 0 && (
          <div className="col-span-full bg-white p-24 text-center rounded-3xl border border-slate-100 shadow-sm text-slate-500">
            <Search size={48} className="mx-auto mb-4 text-slate-200" />
            <h4 className="font-bold text-slate-800 text-sm">Aucun résultat</h4>
            <p className="text-xs text-slate-500 mt-1">Aucun dossier ne correspond à votre recherche.</p>
          </div>
        )}

        {myDossiers.length === 0 && (
          <div className="col-span-full bg-white p-24 text-center rounded-3xl border border-slate-100 shadow-sm text-slate-500">
            <FolderOpen size={48} className="mx-auto mb-4 text-slate-200" />
            <h4 className="font-bold text-slate-800 text-sm">Aucun dossier publié</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Votre espace n'affiche que les dossiers dont l'accès a été formellement autorisé par l'étude.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientPortalDossiers;