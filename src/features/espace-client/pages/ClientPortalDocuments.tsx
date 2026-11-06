import { Download, Eye, FileText, AlertCircle, ShieldCheck } from 'lucide-react';
import { PortalPageHeader } from '../components/PortalPageHeader';
import { ActeSecuriseBadge } from '../components/ActeSecuriseBadge';
import { CertificatIntegrite } from '../components/CertificatIntegrite';
import { useEspaceClientData } from '../context/EspaceClientDataContext';
import { isActeSigneDocument } from '../services/integrite.service';
import { API_BASE_URL } from '@/shared/services/api';

// Table only shows fields confirmed to exist on the real
// /portail/documents-partages/ payload (id, dossier, dossier_numero,
// nom, fichier, created_at) — see NOTES.md. No category/status/url
// fields exist on that endpoint; don't reintroduce them here without
// confirming the backend actually returns them.
export function ClientPortalDocuments() {
  const {
    isLoading,
    hasError,
    myDocs,
    myDossiers,
    unreadNotificationsCount,
    refetch,
  } = useEspaceClientData();

  const resolveUrl = (fileUrl: string) =>
    fileUrl.startsWith('http') ? fileUrl : `${API_BASE_URL}${fileUrl}`;

  const handleDownload = (fileUrl: string, fileName: string) => {
    if (!fileUrl) return;
    const url = resolveUrl(fileUrl);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (fileUrl: string) => {
    if (!fileUrl) return;
    window.open(resolveUrl(fileUrl), '_blank');
  };

  if (isLoading) {
    return <div className="p-4 sm:p-6 lg:p-8 text-sm text-slate-500">Chargement des documents...</div>;
  }

  if (hasError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h4 className="font-bold text-red-800 text-sm">Erreur de chargement</h4>
          <p className="text-xs text-red-600 mt-1">
            Impossible de charger vos documents. Veuillez réessayer.
          </p>
          <button
            onClick={refetch}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl transition-all text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PortalPageHeader
        title="Mes documents partagés"
        subtitle="Consultez et téléchargez les actes et copies authentiques transmis par l'étude."
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-4 px-2">Nom du document</th>
                <th className="py-4 px-2">Dossier</th>
                <th className="py-4 px-2">Date partage</th>
                <th className="py-4 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myDocs.map((doc) => {
                const related = myDossiers.find((d) => d.id === doc.dossierId);
                const hasFile = !!doc.fileUrl;
                const isSignedAct = isActeSigneDocument(doc);

                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-2">
                      <div className="flex items-start gap-2">
                        <FileText size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900">{doc.name || 'Document'}</p>
                          {isSignedAct && (
                            <div className="flex items-center gap-2">
                              <ActeSecuriseBadge />
                              <span className="inline-flex items-center gap-1 text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5 font-semibold">
                                <ShieldCheck size={11} />
                                Acte signé
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="font-semibold text-slate-500">
                        {related?.number || doc.dossierNumber || 'Non spécifié'}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-slate-500">
                      {doc.sharedAt ? new Date(doc.sharedAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="space-x-2 whitespace-nowrap inline-flex items-center">
                        {isSignedAct && <CertificatIntegrite document={doc} />}
                        {hasFile ? (
                          <>
                            <button
                              onClick={() => handleDownload(doc.fileUrl!, doc.name || 'document')}
                              className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors inline-flex"
                              title="Télécharger"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => handleView(doc.fileUrl!)}
                              className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors inline-flex"
                              title="Consulter"
                            >
                              <Eye size={14} />
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Non disponible</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {myDocs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 italic text-sm">
                    <FileText size={48} className="mx-auto mb-4 text-slate-200" />
                    <p>Aucun document partagé sur vos dossiers.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Les documents vous seront transmis au fur et à mesure de l'avancement de vos dossiers.
                    </p>
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

export default ClientPortalDocuments;