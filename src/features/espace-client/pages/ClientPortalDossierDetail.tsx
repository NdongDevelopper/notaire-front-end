import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutDashboard,
  FileCheck,
  Clock,
  AlertCircle,
  Calendar,
  CreditCard,
  Upload,
  CheckCircle2,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { ActeSecuriseBadge } from '../components/ActeSecuriseBadge';
import { CertificatIntegrite } from '../components/CertificatIntegrite';
import { useEspaceClientData } from '../context/EspaceClientDataContext';
import { useToast } from '../../../shared/components/ui/Toast/Toast';
import { isActeSigneDocument } from '../services/integrite.service';
import { isOfflineQueuedError } from '../../../shared/utils/offline/offlineQueue';
import { PATHS } from '../../../routes/Paths';

// NOTE: the original AI Studio prototype had 7 tabs here (summary,
// pieces, documents, messages, appointments, payments, history). Per
// the agreed component split, documents/messages/appointments/payments
// now live as their own top-level pages (ClientPortalDocuments,
// ClientPortalMessages, ClientPortalAppointments, ClientPortalPayments)
// rather than nested tabs — this page keeps only the 3 tabs scoped to
// a single dossier: Vue d'ensemble, Pièces, Chronologie. Flag if the
// per-dossier nested versions of the other four are still wanted here.
type DossierTab = 'overview' | 'pieces' | 'history';

const TABS: { id: DossierTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'pieces', label: 'Pièces', icon: FileCheck },
  { id: 'history', label: 'Chronologie', icon: Clock },
];

export function ClientPortalDossierDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as DossierTab) || 'overview';
  const [activeTab, setActiveTab] = useState<DossierTab>(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'overview',
  );

  const { isLoading, myDossiers, myPieces, myDocs, myAppointments, myPayments, pendingPayment, uploadPiece, getPartiesForDossier, getDossier } =
    useEspaceClientData();
  const toast = useToast();
  const [myRole, setMyRole] = useState<string | undefined>(undefined);
  const [dossierDetails, setDossierDetails] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPieceId, setUploadingPieceId] = useState<string | null>(null);

  const dossier = myDossiers.find((d) => d.id === id);

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);

  useEffect(() => {
    if (!dossier) return;
    let cancelled = false;

    (async () => {
      setLoadingRole(true);
      try {
        const parties = await getPartiesForDossier(dossier.id);
        if (!cancelled) setMyRole(parties[0]?.role);
      } finally {
        if (!cancelled) setLoadingRole(false);
      }

      setLoadingDetails(true);
      try {
        const details = await getDossier(dossier.id);
        if (!cancelled) setDossierDetails(details);
      } finally {
        if (!cancelled) setLoadingDetails(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dossier, getPartiesForDossier, getDossier]);

  const dossierPieces = useMemo(
    () => (dossier ? myPieces.filter((p) => p.dossierId === dossier.id) : []),
    [myPieces, dossier],
  );
  const dossierPayments = useMemo(
    () => (dossier ? myPayments.filter((p) => p.dossierId === dossier.id) : []),
    [myPayments, dossier],
  );
  const dossierNextAppointment = useMemo(
    () =>
      dossier
        ? myAppointments
            .filter((a) => a.dossierId === dossier.id && (a.status === 'Confirmé' || a.status === 'Proposé'))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
        : undefined,
    [myAppointments, dossier],
  );

  // Actes signés de CE dossier (feedback client #1) : détection par
  // heuristique de nom + catégorie (voir integrite.service.ts).
  const dossierSignedActs = useMemo(
    () => (dossier ? myDocs.filter((d) => d.dossierId === dossier.id && isActeSigneDocument(d)) : []),
    [myDocs, dossier],
  );

  const handleUploadClick = (pieceId: string) => {
    setUploadingPieceId(pieceId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadingPieceId || !dossier) return;
    const piece = dossierPieces.find((p) => p.id === uploadingPieceId);
    try {
      await uploadPiece(uploadingPieceId, dossier.id, piece?.typePiece || 'AUTRE', file);
    } catch (error) {
      // L'intercepteur met la requête en file d'attente hors ligne et la
      // rejette avec OfflineQueuedError — déjà traité comme « en attente
      // d'envoi » localement. Toute autre erreur = vraie panne : on informe.
      if (!isOfflineQueuedError(error)) {
        toast.error("L'envoi de la pièce a échoué. Veuillez réessayer.");
      }
    } finally {
      setUploadingPieceId(null);
    }
  };

  const changeTab = (tab: DossierTab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  if (isLoading) {
    return <div className="p-4 sm:p-6 lg:p-8 text-sm text-slate-500">Chargement du dossier...</div>;
  }

  if (!dossier) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate(PATHS.espaceClientDossiers)}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-bold bg-white px-4 py-2 border border-slate-200 rounded-xl transition-all"
        >
          <ArrowLeft size={16} /> Retour à mes dossiers
        </button>
        <p className="mt-8 text-center text-slate-500 text-sm italic">
          Ce dossier n'existe pas ou n'est plus accessible depuis votre espace.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} accept=".pdf,.jpg,.jpeg,.png" />
      <button
        onClick={() => navigate(PATHS.espaceClientDossiers)}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-bold bg-white px-4 py-2 border border-slate-200 rounded-xl transition-all"
      >
        <ArrowLeft size={16} /> Retour à mes dossiers
      </button>

      {/* Dossier header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full filter blur-3xl -mr-20 -mt-20" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-3">
                  {loadingRole ? (
                    <span className="bg-slate-700 text-slate-300 text-xs font-bold uppercase px-2.5 py-1 rounded-md animate-pulse">
                      Chargement...
                    </span>
                  ) : (
                    <span className="bg-amber-500 text-slate-950 text-xs font-bold uppercase px-2.5 py-1 rounded-md">
                      Rôle : {myRole || 'Partie'}
                    </span>
                  )}
                  <span className="text-slate-400 text-xs font-medium">
                    Ouvert le {new Date(dossier.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-3xl font-extrabold tracking-tight mt-3">{dossier.number}</h3>
                <p className="text-slate-300 text-lg mt-1 font-medium">{dossier.type} immobilière</p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Statut :</span>
                  <StatusBadge status={dossier.clientStatus} />
                </div>
                <div className="w-full md:w-56 mt-1">
                  <div className="flex justify-between text-xs font-medium mb-1 text-slate-300">
                    <span>Progression</span>
                    <span className="font-bold text-amber-500">
                      {loadingDetails && dossierDetails === null
                        ? '...'
                        : dossierDetails?.completude_pieces !== undefined
                          ? `${dossierDetails.completude_pieces}%`
                          : `${dossier.progression || 0}%`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${loadingDetails && dossierDetails === null ? '0%' : dossierDetails?.completude_pieces !== undefined ? dossierDetails.completude_pieces : dossier.progression || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

        <div className="border-t border-slate-800/80 mt-6 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Contact principal à l'étude :</span>
            {dossierDetails?.parties && dossierDetails.parties.length > 0 ? (
              <>
                <div className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-xs">
                  {dossierDetails.parties[0]?.nom?.charAt(0) || 'N'}
                </div>
                <span className="font-bold text-slate-200">{dossierDetails.parties[0]?.nom || 'Contact étude'}</span>
                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-500 text-xs font-bold">
                  {dossierDetails.parties[0]?.role || 'Collaborateur'}
                </span>
              </>
            ) : (
              <span className="font-bold text-slate-200">Contact en cours d'attribution</span>
            )}
          </div>
          <div className="flex gap-4">
            <span>Téléphone étude : +221 33 800 00 00</span>
            <span>E-mail direct : contact@notaire-diouf.sn</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-200 bg-white p-1.5 rounded-2xl shadow-sm border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">Résumé du dossier</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Voici un état descriptif de la procédure en cours pour votre dossier.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Objet de l'acte</p>
                    <p className="font-bold text-slate-800 mt-1">{dossier.type} immobilière</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {dossierDetails?.objet || dossier.type} - {dossierDetails?.type_acte_libelle || 'Procédure notariale'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Prochaine étape attendue</p>
                    <p className="font-bold text-amber-600 mt-1">
                      {dossierDetails?.taches?.find((t: any) => t.statut === 'en_cours')?.titre || dossierDetails?.statut_display || dossier.status}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {dossierDetails?.taches?.find((t: any) => t.statut === 'en_cours')?.titre 
                        ? 'En cours de traitement par l\'étude notariale.' 
                        : 'Votre dossier est en cours de traitement de notre côté.'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Date d'enregistrement</p>
                    <p className="font-bold text-slate-800 mt-1">
                      {new Date(dossier.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Documents déjà envoyés</p>
                    <p className="font-bold text-slate-800 mt-1">
                      {dossierDetails?.completude_pieces !== undefined ? `${dossierDetails.completude_pieces}%` : `${dossier.progression || 0}%`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {dossierDetails?.completude_pieces !== undefined 
                        ? dossierDetails.completude_pieces >= 100 
                          ? 'Toutes les pièces requises ont été fournies.' 
                          : `${100 - dossierDetails.completude_pieces}% des pièces restent à fournir.`
                        : 'Suivi de l\'avancement des documents requis.'}
                    </p>
                  </div>
                </div>

                <div className="p-5 border border-amber-200 bg-amber-50/40 rounded-2xl flex gap-4">
                  <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-amber-800 font-extrabold text-sm">Actions immédiates attendues</p>
                    <ul className="text-xs text-amber-700 space-y-1.5 mt-2 list-disc list-inside">
                      {dossierPieces
                        .filter((p) => p.clientStatus === 'À fournir')
                        .map((p) => (
                          <li key={p.id}>
                            Fournir la pièce : <span className="font-bold">{p.name}</span>
                          </li>
                        ))}
                      {pendingPayment && pendingPayment.dossierId === dossier.id && (
                        <li>
                          Régler la provision demandée de :{' '}
                          <span className="font-bold">{pendingPayment.amount.toLocaleString()} FCFA</span>
                        </li>
                      )}
                      {dossierNextAppointment?.status === 'Proposé' && (
                        <li>Confirmer la proposition de rendez-vous de signature.</li>
                      )}
                      {dossierPieces.filter((p) => p.clientStatus === 'À fournir').length === 0 &&
                        !(pendingPayment && pendingPayment.dossierId === dossier.id) && (
                          <li>Aucune action urgente en attente. Votre dossier est en cours de traitement de notre côté.</li>
                        )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actes signés du dossier (feedback client #1) */}
              {dossierSignedActs.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-600" />
                      Vos actes signés
                    </h4>
                    <ActeSecuriseBadge />
                  </div>
                  <ul className="space-y-3">
                    {dossierSignedActs.map((doc) => (
                      <li
                        key={doc.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex gap-3 items-start min-w-0">
                          <FileCheck size={16} className="text-violet-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{doc.name || 'Acte signé'}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Signé le {doc.sharedAt ? new Date(doc.sharedAt).toLocaleDateString('fr-FR') : '—'}
                            </p>
                          </div>
                        </div>
                        <CertificatIntegrite document={doc} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {dossierNextAppointment ? (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm">Rendez-vous à venir</h4>
                    <Calendar size={18} className="text-amber-500" />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex gap-2 text-slate-600">
                      <Clock size={14} className="mt-0.5" />
                      <div>
                        <p className="font-bold">
                          {new Date(dossierNextAppointment.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-slate-500 mt-0.5">à {dossierNextAppointment.time}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <p className="font-bold text-slate-800">{dossierNextAppointment.purpose}</p>
                      <p className="text-slate-500 mt-1">{dossierNextAppointment.location}</p>
                    </div>
                    <div className="pt-2">
                      <StatusBadge status={dossierNextAppointment.status} />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(PATHS.espaceClientRendezVous)}
                    className="w-full text-center text-xs font-bold text-amber-600 hover:text-amber-700 mt-1"
                  >
                    Gérer les rendez-vous →
                  </button>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center py-8">
                  <Calendar size={32} className="text-slate-300 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 text-sm">Aucun rendez-vous</h4>
                  <p className="text-xs text-slate-500 mt-1">Aucune séance planifiée pour l'instant.</p>
                </div>
              )}

              <div className="bg-slate-950 text-white p-6 rounded-3xl shadow-lg border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-sm">Suivi des provisions</h4>
                  <CreditCard size={18} className="text-amber-500" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Provisions demandées</span>
                    <span className="font-bold">
                      {dossierPayments.reduce((acc, c) => acc + c.amount, 0).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Montant payé</span>
                    <span className="font-bold text-emerald-400">
                      {dossierPayments.filter((p) => p.isPaid).reduce((acc, c) => acc + c.amount, 0).toLocaleString()} FCFA
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-slate-300 font-bold text-xs">Reste à payer</span>
                    <span className="font-bold text-amber-500 text-sm">
                      {dossierPayments.filter((p) => !p.isPaid).reduce((acc, c) => acc + c.amount, 0).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                {pendingPayment && pendingPayment.dossierId === dossier.id && (
                  <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-xs text-amber-400">
                    <p className="font-bold">Paiement en attente :</p>
                    <p className="mt-0.5">
                      {pendingPayment.label} : {pendingPayment.amount.toLocaleString()} FCFA
                    </p>
                  </div>
                )}

                <button
                  onClick={() => navigate(PATHS.espaceClientPaiements)}
                  className="w-full py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-all hover:bg-amber-400"
                >
                  Consulter les détails financiers
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pieces' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
            <div>
              <h4 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">Pièces à fournir</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Veuillez envoyer les documents requis par l'étude pour l'instruction de votre dossier.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {dossierPieces.map((piece) => (
                <div key={piece.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-3">
                      <h5 className="font-bold text-slate-900 text-sm">{piece.name}</h5>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                          piece.isMandatory ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {piece.isMandatory ? 'Obligatoire' : 'Facultatif'}
                      </span>

                      <StatusBadge status={piece.clientStatus} />
                    </div>
                    <p className="text-xs text-slate-500">{piece.description}</p>

                    {piece.clientStatus === 'Rejetée' && piece.rejectionComment && (
                      <div className="mt-2 bg-rose-50 text-rose-800 p-3 rounded-xl border border-rose-200 text-xs flex gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold">Motif du rejet de l'étude : </span>
                          <span>"{piece.rejectionComment}"</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    {piece.clientStatus === 'Validée' ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 size={16} /> Validée
                      </div>
                    ) : piece.clientStatus === 'En vérification' ? (
                      <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                        <Clock size={16} /> Reçue, en cours de vérification
                      </div>
                    ) : piece.pendingSync || piece.clientStatus === "En attente d'envoi" ? (
                      <div className="flex items-center gap-1.5 font-bold text-xs bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-xl">
                        <WifiOff size={14} /> En attente d'envoi
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUploadClick(piece.id)}
                        disabled={uploadingPieceId === piece.id}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-amber-500"
                      >
                        <Upload size={14} />
                        {uploadingPieceId === piece.id ? 'Envoi...' : piece.clientStatus === 'Rejetée' ? 'Remplacer le document' : 'Envoyer (PDF, JPG)'}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {dossierPieces.length === 0 && (
                <p className="text-slate-500 text-center py-12 italic text-sm">Aucune pièce requise pour ce dossier.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div>
              <h4 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">Chronologie simplifiée</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivez les jalons clés franchis dans l'instruction de votre dossier.
              </p>
            </div>

            <div className="relative border-l border-slate-200 pl-6 space-y-8 ml-3 py-2 text-xs">
              {dossierDetails?.taches?.map((task: any) => (
                <TimelineStep
                  key={task.id}
                  title={task.titre}
                  description={task.statut === 'termine' ? 'Étape terminée avec succès.' : task.statut === 'en_cours' ? 'En cours de traitement.' : 'En attente de traitement.'}
                  dateLabel={task.echeance ? new Date(task.echeance).toLocaleDateString() : undefined}
                />
              ))}
              {(!dossierDetails?.taches || dossierDetails.taches.length === 0) && (
                <>
                  {(dossier.progression ?? 0) >= 90 && (
                    <TimelineStep
                      title="Enregistrement & Formalités de publication"
                      description="L'acte signé a été transmis pour paiement des droits d'enregistrement au service fiscal de l'État."
                    />
                  )}
                  {(dossier.progression ?? 0) >= 80 && (
                    <TimelineStep
                      title="Séance de signature programmée"
                      description="Rendez-vous acté pour signature définitive par devant Me Bineta Diouf."
                    />
                  )}
                  {(dossier.progression ?? 0) >= 65 && (
                    <TimelineStep
                      title="Projet d'acte de vente rédigé"
                      description="La rédaction initiale de l'acte a été validée par le juriste d'étude et partagée pour relecture."
                    />
                  )}
                  {(dossier.progression ?? 0) >= 30 && (
                    <TimelineStep
                      title="Instruction des pièces justificatives"
                      description="Le client a commencé à fournir les pièces d'état civil indispensables."
                    />
                  )}
                  <TimelineStep
                    title="Ouverture de l'instruction notariale"
                    description="Le dossier a été enregistré à l'étude."
                    dateLabel={new Date(dossier.createdAt).toLocaleDateString()}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineStep({ title, description, dateLabel }: { title: string; description: string; dateLabel?: string }) {
  return (
    <div className="relative">
      <span className="absolute -left-[31px] top-0 bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold">
        ✓
      </span>
      <div>
        <p className="font-bold text-slate-900">{title}</p>
        <p className="text-slate-500 mt-0.5">{description}</p>
        {dateLabel && <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">{dateLabel}</p>}
      </div>
    </div>
  );
}

export default ClientPortalDossierDetail;