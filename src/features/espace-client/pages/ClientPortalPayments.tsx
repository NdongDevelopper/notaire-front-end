import { PortalPageHeader } from '../components/PortalPageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useEspaceClientData } from '../context/EspaceClientDataContext';

export function ClientPortalPayments() {
  const { isLoading, myPayments, myDossiers, unreadNotificationsCount } = useEspaceClientData();

  if (isLoading) {
    return <div className="p-4 sm:p-6 lg:p-8 text-sm text-slate-500">Chargement des paiements...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PortalPageHeader
        title="Mes paiements"
        subtitle="Consultez les provisions demandées pour vos dossiers et leur état de règlement."
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Provisions demandées par l'étude</h4>
          <p className="text-xs text-slate-500">Vous trouverez ici toutes les demandes de paiement transmises par la comptabilité notariale.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-4 px-2">Désignation de la provision</th>
                <th className="py-4 px-2">Dossier</th>
                <th className="py-4 px-2">Montant requis</th>
                <th className="py-4 px-2">Date d'avis</th>
                <th className="py-4 px-2">Statut</th>
                <th className="py-4 px-2 text-right">Justificatif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myPayments.map((p) => {
                const rel = myDossiers.find((d) => d.id === p.dossierId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-2 font-bold text-slate-900">{p.label || "Provision d'instruction"}</td>
                    <td className="py-4 px-2 font-semibold text-slate-500">{rel?.number}</td>
                    <td className="py-4 px-2 font-bold text-slate-800">{p.amount.toLocaleString()} FCFA</td>
                    <td className="py-4 px-2 text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="py-4 px-2">
                      <StatusBadge status={p.isPaid ? 'Payé' : 'En attente de paiement'} />
                    </td>
                    <td className="py-4 px-2 text-right">
                      {p.isPaid ? (
                        <button className="text-amber-600 font-bold hover:underline">Reçu fiscal</button>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Voir instructions de virement</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {myPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 italic text-sm">
                    Aucun paiement pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ClientPortalPayments;