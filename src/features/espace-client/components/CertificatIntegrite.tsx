import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, Loader2, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/Modal/Modal';
import { getCertificatIntegrite } from '../services/integrite.service';
import type { SharedDocument } from '../types/client.types';

interface CertificatIntegriteProps {
  document: SharedDocument;
  triggerClassName?: string;
}

/**
 * Modal « Certificat de sécurité » d'un acte signé (feedback client #1).
 * Charge le certificat d'intégrité à l'ouverture uniquement (useQuery
 * `enabled`), présente une explication vulgarisée + confirmation
 * « ✓ Intégrité vérifiée », et replie le détail technique (empreinte
 * cryptographique, date de scellement) dans un bloc repliable.
 */
export function CertificatIntegrite({ document, triggerClassName }: CertificatIntegriteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['integrite', document.id],
    queryFn: () => getCertificatIntegrite(document.id),
    enabled: isOpen,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={triggerClassName ?? 'inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition-all hover:bg-emerald-100'}
      >
        <Lock size={14} />
        Voir le certificat de sécurité
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Certificat de sécurité"
        size="md"
      >
        <div className="space-y-4">
          {/* Statut de chargement */}
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 size={28} className="text-emerald-600 animate-spin" />
              <p className="text-sm text-slate-600">Vérification de l'intégrité du document…</p>
            </div>
          )}

          {/* Erreur + réessayer */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                <AlertCircle size={26} />
              </div>
              <p className="text-sm font-bold text-slate-800">Impossible de charger le certificat.</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Le serveur est peut-être momentanément indisponible. Réessayez dans un instant.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
              >
                <RefreshCw size={14} />
                Réessayer
              </button>
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              {/* Confirmation vulgarisée — verdict réel du serveur
                  (verification_document.conforme + verification_chaine.statut_global),
                  plus de vert inconditionnel. */}
              {data.verified === false || data.status === 'invalide' ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
                  <div className="w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertCircle size={22} />
                  </div>
                  <p className="font-extrabold text-rose-800 text-sm">
                    ⚠ Alerte d'intégrité
                  </p>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                    La vérification a détecté une anomalie : l'empreinte de ce
                    document ne correspond plus à celle enregistrée à la
                    signature, ou la chaîne des sceaux a été rompue. Merci de
                    contacter l'étude.
                  </p>
                </div>
              ) : data.verified === undefined && !data.status ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                  <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck size={22} />
                  </div>
                  <p className="font-extrabold text-amber-800 text-sm">
                    Sceau d'intégrité présent
                  </p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Le document porte un sceau cryptographique, mais la
                    confirmation de vérification du serveur n'a pas pu être
                    chargée pour le moment.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck size={22} />
                  </div>
                  <p className="font-extrabold text-emerald-800 text-sm">
                    ✓ Intégrité vérifiée
                  </p>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                    Ce document est protégé par un système de sécurité cryptographique qui
                    garantit qu'il n'a pas été modifié depuis sa signature.
                  </p>
                </div>
              )}

              {/* Ligne explicative pour non-techniciens */}
              <p className="text-xs text-slate-600 leading-relaxed">
                Quand un acte notarié est signé, une « empreinte numérique » unique est
                calculée sur son contenu (comme une trace digitale) puis scellée à la
                date de signature. Toute modification du document, même infime,
                changerait cette empreinte : c'est la preuve que votre acte est resté
                tel qu'il a été signé.
              </p>

              {/* Détail technique repliable */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowDetail((s) => !s)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
                  aria-expanded={showDetail}
                >
                  <span className="flex items-center gap-1.5">
                    <Lock size={14} className="text-slate-500" />
                    Détail technique
                  </span>
                  <ChevronDown size={15} className={`text-slate-500 transition-transform ${showDetail ? 'rotate-180' : ''}`} />
                </button>

                {showDetail && (
                  <dl className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-xs">
                    {data.hash && (
                      <div>
                        <dt className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-1">
                          Empreinte cryptographique (SHA-256)
                        </dt>
                        <dd className="font-mono text-[11px] text-slate-700 break-all bg-slate-50 rounded-lg p-2 border border-slate-100">
                          {data.hash}
                        </dd>
                      </div>
                    )}
                    {data.hashFichierActuel && data.hashFichierActuel !== data.hash && (
                      <div>
                        <dt className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-1">
                          Empreinte actuelle du fichier
                        </dt>
                        <dd className="font-mono text-[11px] text-slate-700 break-all bg-slate-50 rounded-lg p-2 border border-slate-100">
                          {data.hashFichierActuel}
                        </dd>
                      </div>
                    )}
                    {data.hashBloc && (
                      <div>
                        <dt className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-1">
                          Empreinte du dernier bloc (sceau)
                        </dt>
                        <dd className="font-mono text-[11px] text-slate-700 break-all bg-slate-50 rounded-lg p-2 border border-slate-100">
                          {data.hashBloc}
                        </dd>
                      </div>
                    )}
                    {data.sealedAt && (
                      <div className="flex justify-between border-t border-slate-100 pt-2">
                        <dt className="font-bold text-slate-500">Date de mise sous scellé</dt>
                        <dd className="font-semibold text-slate-800">
                          {new Date(data.sealedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </dd>
                      </div>
                    )}
                    {typeof data.nbBlocs === 'number' && (
                      <div className="flex justify-between border-t border-slate-100 pt-2">
                        <dt className="font-bold text-slate-500">Blocs de la chaîne</dt>
                        <dd className="font-semibold text-slate-800">{data.nbBlocs}</dd>
                      </div>
                    )}
                    {data.status && (
                      <div className="flex justify-between">
                        <dt className="font-bold text-slate-500">Statut de la chaîne</dt>
                        <dd
                          className={`font-semibold ${data.status === 'invalide' ? 'text-rose-600' : 'text-emerald-700'}`}
                        >
                          {data.status === 'valide' ? 'Valide' : data.status}
                        </dd>
                      </div>
                    )}
                    {data.documentName && (
                      <div className="flex justify-between">
                        <dt className="font-bold text-slate-500">Document</dt>
                        <dd className="font-semibold text-slate-800 text-right">{data.documentName}</dd>
                      </div>
                    )}
                    {data.dossierNumber && (
                      <div className="flex justify-between">
                        <dt className="font-bold text-slate-500">Dossier</dt>
                        <dd className="font-semibold text-slate-800">{data.dossierNumber}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

export default CertificatIntegrite;