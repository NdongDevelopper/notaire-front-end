import { useRef, useState } from 'react';
import { CheckCircle2, Clock, HelpCircle, Upload, WifiOff } from 'lucide-react';
import { PortalPageHeader } from '../components/PortalPageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Tooltip } from '../../../shared/components/ui/Tooltip/Tooltip';
import { useEspaceClientData } from '../context/EspaceClientDataContext';
import { useToast } from '../../../shared/components/ui/Toast/Toast';
import { isOfflineQueuedError } from '../../../shared/utils/offline/offlineQueue';

type PieceFilter = 'all' | 'pending' | 'checking' | 'validated' | 'rejected';

const FILTERS: { id: PieceFilter; label: string }[] = [
  { id: 'all', label: 'Toutes les pièces' },
  { id: 'pending', label: 'À fournir' },
  { id: 'checking', label: 'En vérification' },
  { id: 'validated', label: 'Validées' },
  { id: 'rejected', label: 'Rejetées' },
];

export function ClientPortalPieces() {
  const { isLoading, myPieces, myDossiers, unreadNotificationsCount, uploadPiece } = useEspaceClientData();
  const toast = useToast();
  const [filter, setFilter] = useState<PieceFilter>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPieceId, setUploadingPieceId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadClick = (pieceId: string) => {
    setUploadingPieceId(pieceId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadingPieceId) return;
    const piece = myPieces.find((p) => p.id === uploadingPieceId);
    if (!piece) return;
    setIsUploading(true);
    try {
      await uploadPiece(piece.id, piece.dossierId, piece.typePiece || 'AUTRE', file);
    } catch (error) {
      // Hors ligne : la pièce a été mise en file d'attente (déjà exprimée
      // en « En attente d'envoi » par le contexte). Toute autre panne = erreur.
      if (!isOfflineQueuedError(error)) {
        toast.error("L'envoi de la pièce a échoué. Veuillez réessayer.");
      }
    } finally {
      setIsUploading(false);
      setUploadingPieceId(null);
    }
  };

  if (isLoading) {
    return <div className="p-4 sm:p-6 lg:p-8 text-sm text-slate-500">Chargement des pièces...</div>;
  }

  const filteredPieces = myPieces.filter((p) => {
    if (filter === 'pending') return p.clientStatus === 'À fournir' || p.clientStatus === "En attente d'envoi";
    if (filter === 'checking') return p.clientStatus === 'En vérification';
    if (filter === 'validated') return p.clientStatus === 'Validée';
    if (filter === 'rejected') return p.clientStatus === 'Rejetée';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} accept=".pdf,.jpg,.jpeg,.png" />
      <PortalPageHeader
        title="Mes pièces à fournir"
        subtitle="Vérifiez et envoyez les justificatifs demandés par le notaire pour vos dossiers."
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="flex flex-wrap gap-2 bg-white p-1.5 border border-slate-200 rounded-2xl w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              filter === f.id ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
        {isUploading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-bold text-amber-800 flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Envoi en cours, veuillez patienter...
          </div>
        )}
        <div className="divide-y divide-slate-100">
          {filteredPieces.map((piece) => {
            const relatedDossier = myDossiers.find((d) => d.id === piece.dossierId);
            return (
              <div key={piece.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-bold text-slate-900 text-sm">{piece.name}</h5>
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-medium">
                      Dossier : {relatedDossier?.number || 'Non lié'}
                    </span>
                    <StatusBadge status={piece.clientStatus} />
                  </div>
                  <p className="text-xs text-slate-500">{piece.description}</p>
                  {piece.rejectionComment && (
                    <p className="text-xs text-rose-600 mt-1">⚠️ Motif rejet : "{piece.rejectionComment}"</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {piece.pendingSync || piece.clientStatus === "En attente d'envoi" ? (
                    <span className="text-orange-700 text-xs font-bold bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <WifiOff size={14} /> En attente d'envoi
                    </span>
                  ) : piece.clientStatus === 'Validée' ? (
                    <span className="text-emerald-600 text-xs font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Validée
                    </span>
                  ) : piece.clientStatus === 'En vérification' ? (
                    <span className="text-indigo-600 text-xs font-bold bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Clock size={14} /> Reçue, en cours de vérification
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUploadClick(piece.id)}
                        disabled={isUploading}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-amber-500"
                      >
                        <Upload size={14} />
                        {uploadingPieceId === piece.id && isUploading ? 'Envoi...' : 'Envoyer'}
                      </button>
                      <Tooltip label="Envoyez ici une copie (PDF ou photo) du justificatif demandé. L'étude la vérifiera.">
                        <button
                          type="button"
                          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          aria-label="Aide : comment envoyer une pièce"
                        >
                          <HelpCircle size={16} />
                        </button>
                      </Tooltip>
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredPieces.length === 0 && (
            <p className="text-slate-500 text-center py-12 italic text-sm">Aucun justificatif demandé pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientPortalPieces;