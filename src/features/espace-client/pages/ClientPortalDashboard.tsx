import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  FileCheck,
  FileText,
  Calendar,
  ChevronRight,
  AlertCircle,
  CreditCard,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { PortalPageHeader } from '../components/PortalPageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Tooltip } from '../../../shared/components/ui/Tooltip/Tooltip';
import { useEspaceClientData } from '../context/EspaceClientDataContext';
import { PATHS } from '../../../routes/Paths';

export function ClientPortalDashboard() {
  const navigate = useNavigate();
  const {
    isLoading,
    client,
    myDossiers,
    myPieces,
    myDocs,
    myAppointments,
    myConversations,
    unreadNotificationsCount,
    nextAppointment,
    pendingPayment,
  } = useEspaceClientData();

  if (isLoading || !client) {
    return <div className="p-4 sm:p-6 lg:p-8 text-sm text-slate-500">Chargement de votre espace...</div>;
  }

  const piecesToProvide = myPieces.filter(
    (p) => p.clientStatus === 'À fournir' || p.clientStatus === 'Rejetée' || p.clientStatus === "En attente d'envoi" || p.pendingSync,
  );
  const proposedAppointment = myAppointments.filter((a) => a.status === 'Proposé')[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <PortalPageHeader
        title={`Bonjour, ${client.firstName}`}
        subtitle="Voici l'avancement en temps réel de vos dossiers notariaux."
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          onClick={() => navigate(PATHS.espaceClientDossiers)}
        >
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
            <FolderOpen size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Dossiers actifs</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{myDossiers.length}</p>
          </div>
        </div>

        <div 
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          onClick={() => navigate(PATHS.espaceClientPieces)}
        >
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
            <FileCheck size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pièces à fournir</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{piecesToProvide.length}</p>
          </div>
        </div>

        <div 
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          onClick={() => navigate(PATHS.espaceClientDocuments)}
        >
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Documents partagés</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{myDocs.length}</p>
          </div>
        </div>

        <div 
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          onClick={() => navigate(PATHS.espaceClientRendezVous)}
        >
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Prochain rendez-vous</p>
            <p className="text-sm font-extrabold text-slate-900 mt-2 truncate">
              {nextAppointment ? new Date(nextAppointment.date).toLocaleDateString('fr-FR') : 'Aucun'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-sm">Mes dossiers récents</h3>
              <button
                onClick={() => navigate(PATHS.espaceClientDossiers)}
                className="text-amber-600 hover:text-amber-700 text-xs font-bold"
              >
                Voir tout
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {myDossiers.slice(0, 3).map((d) => (
                <div key={d.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-500 font-extrabold flex items-center justify-center text-sm shadow-md">
                      {d.type.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{d.number}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {d.type} immobilière • Màj le {new Date(d.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={d.clientStatus} />
                    <button
                      onClick={() => navigate(PATHS.espaceClientDossierDetails(d.id))}
                      className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
                    >
                      Voir <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {myDossiers.length === 0 && (
                <p className="p-12 text-center text-slate-500 italic text-sm">Aucun dossier accessible.</p>
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Actions attendues de votre part</h3>
            <div className="space-y-3">
              {piecesToProvide.slice(0, 2).map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex items-center justify-between gap-4"
                >
                  <div className="flex gap-3">
                    <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Fournir le document requis</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        "{p.name}" pour le dossier {myDossiers.find((d) => d.id === p.dossierId)?.number}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => navigate(`${PATHS.espaceClientDossierDetails(p.dossierId)}?tab=pieces`)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all uppercase"
                    >
                      Transmettre
                    </button>
                    <Tooltip label="Tout se passe dans le dossier : choisissez le justificatif à envoyer depuis l'onglet « Pièces ».">
                      <button
                        type="button"
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-amber-100 rounded-lg transition-colors"
                        aria-label="Aide : comment transmettre une pièce"
                      >
                        <HelpCircle size={16} />
                      </button>
                    </Tooltip>
                  </span>
                </div>
              ))}

              {pendingPayment && (
                <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex items-center justify-between gap-4">
                  <div className="flex gap-3">
                    <CreditCard size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Régler un acompte/provision en attente</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {pendingPayment.label} :{' '}
                        <span className="font-extrabold text-rose-600">
                          {pendingPayment.amount.toLocaleString()} FCFA
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(PATHS.espaceClientPaiements)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all uppercase"
                  >
                    Payer
                  </button>
                </div>
              )}

              {proposedAppointment && (
                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-center justify-between gap-4">
                  <div className="flex gap-3">
                    <Calendar size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Confirmer un rendez-vous</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Signature d'acte planifiée le {new Date(proposedAppointment.date).toLocaleDateString()} à{' '}
                        {proposedAppointment.time}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(PATHS.espaceClientRendezVous)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all uppercase"
                  >
                    Valider
                  </button>
                </div>
              )}

              {piecesToProvide.length === 0 && !pendingPayment && !proposedAppointment && (
                <div className="p-5 text-center text-slate-500 text-xs italic bg-slate-50 rounded-2xl border">
                  Aucune action requise de votre part pour le moment.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-extrabold text-slate-900 text-sm">Échanges récents</h3>
              <MessageSquare size={16} className="text-amber-500" />
            </div>
            <div className="space-y-4">
              {myConversations.slice(0, 3).map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-extrabold text-amber-600">{c.subject}</span>
                    {c.lastMessageAt && (
                      <span className="text-slate-500">{new Date(c.lastMessageAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {c.messageCount ?? 0} message(s) {c.dossierNumber ? `• ${c.dossierNumber}` : ''}
                  </p>
                </div>
              ))}

              {myConversations.length === 0 && (
                <p className="text-slate-500 text-center text-xs italic">Aucune conversation.</p>
              )}
            </div>
            <button
              onClick={() => navigate(PATHS.espaceClientMessages)}
              className="w-full text-center text-xs font-bold text-amber-600 hover:text-amber-700 pt-2"
            >
              Ouvrir la messagerie globale →
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ClientPortalDashboard;
