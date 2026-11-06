import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
import { Modal } from '../../../../shared/components/ui/Modal/Modal';
import { useToast } from '../../../../shared/components/ui/Toast/Toast';
import { useTypesActes } from '../../hooks/useTypesActes';
import { useCreateEtape, useUpdateEtape, useDeleteEtape } from '../../hooks/useEtapesWorkflow';
import { useCreateChecklistPiece, useUpdateChecklistPiece, useDeleteChecklistPiece } from '../../hooks/useChecklistPieces';

/** Cible de configuration : le type d'acte dont on configure le workflow. */
export interface WorkflowConfigTarget {
  id: string;
  title: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  typeActe: WorkflowConfigTarget | null;
}

export const WorkflowConfigModal: React.FC<Props> = ({ isOpen, onClose, typeActe }) => {
  const toast = useToast();

  // On lit les étapes/checklist depuis la liste des types d'actes (elles y sont imbriquées).
  const { data: typesActes } = useTypesActes();
  const current = typesActes?.find((t) => String(t.id) === String(typeActe?.id));
  const typeActeId = Number(typeActe?.id);

  const etapes = [...(current?.etapes ?? [])].sort((a, b) => a.ordre - b.ordre);
  const checklist = current?.checklist ?? [];

  const createEtape = useCreateEtape();
  const updateEtape = useUpdateEtape();
  const deleteEtape = useDeleteEtape();
  const createPiece = useCreateChecklistPiece();
  const updatePiece = useUpdateChecklistPiece();
  const deletePiece = useDeleteChecklistPiece();

  // Formulaire d'ajout d'étape
  const [nomEtape, setNomEtape] = useState('');
  const [obligatoireEtape, setObligatoireEtape] = useState(true);
  const [delaiEtape, setDelaiEtape] = useState('1');

  // Formulaire d'ajout de pièce
  const [libellePiece, setLibellePiece] = useState('');
  const [obligatoirePiece, setObligatoirePiece] = useState(true);

  const handleAddEtape = async () => {
    const nom = nomEtape.trim();
    if (!nom) return;
    const nextOrdre = etapes.length ? Math.max(...etapes.map((e) => e.ordre)) + 1 : 1;
    try {
      await createEtape.mutateAsync({ type_acte: typeActeId, nom, ordre: nextOrdre, obligatoire: obligatoireEtape, delai_jours: Number(delaiEtape) || 0 });
      setNomEtape('');
      setObligatoireEtape(true);
      setDelaiEtape('1');
    } catch {
      toast.error("Impossible d'ajouter l'étape.");
    }
  };

  const handleMoveEtape = async (index: number, direction: -1 | 1) => {
    const target = etapes[index];
    const neighbor = etapes[index + direction];
    if (!target || !neighbor) return;
    try {
      await Promise.all([
        updateEtape.mutateAsync({ id: target.id, data: { ordre: neighbor.ordre } }),
        updateEtape.mutateAsync({ id: neighbor.id, data: { ordre: target.ordre } }),
      ]);
    } catch {
      toast.error('Impossible de réordonner les étapes.');
    }
  };

  const handleAddPiece = async () => {
    const libelle = libellePiece.trim();
    if (!libelle) return;
    try {
      await createPiece.mutateAsync({ type_acte: typeActeId, libelle_piece: libelle, obligatoire: obligatoirePiece });
      setLibellePiece('');
      setObligatoirePiece(true);
    } catch {
      toast.error("Impossible d'ajouter la pièce.");
    }
  };

  const inputClass =
    'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-text bg-white outline-none transition-all focus:border-activeBtn focus:ring-1 focus:ring-activeBtn';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={typeActe ? `Configurer : ${typeActe.title}` : 'Configurer le workflow'} size="lg">
      <div className="space-y-8">
        {/* ---------------- ÉTAPES DU WORKFLOW ---------------- */}
        <section>
          <h4 className="text-sm font-bold text-text mb-1">Étapes du workflow</h4>
          <p className="text-sm text-text-muted mb-4">Les étapes par lesquelles passe un dossier de ce type (vue Kanban).</p>

          {etapes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-text-muted">Aucune étape pour l'instant.</div>
          ) : (
            <ul className="flex flex-col gap-2 mb-4">
              {etapes.map((etape, index) => (
                <li key={etape.id} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => handleMoveEtape(index, -1)}
                      disabled={index === 0 || updateEtape.isPending}
                      className="text-slate-400 hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveEtape(index, 1)}
                      disabled={index === etapes.length - 1 || updateEtape.isPending}
                      className="text-slate-400 hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  <span className="flex-1 text-sm font-medium text-text">{etape.nom}</span>
                  <span className="text-xs text-text-muted whitespace-nowrap">{etape.delai_jours} j</span>

                  <label className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={etape.obligatoire}
                      onChange={(e) => updateEtape.mutateAsync({ id: etape.id, data: { obligatoire: e.target.checked } }).catch(() => toast.error('Modification impossible.'))}
                      className="w-3.5 h-3.5 accent-activeBtn cursor-pointer"
                    />
                    Obligatoire
                  </label>

                  <button
                    type="button"
                    onClick={() => deleteEtape.mutateAsync(etape.id).catch(() => toast.error('Suppression impossible.'))}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Formulaire d'ajout d'étape (complet) */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-3 rounded-lg border border-slate-100">
            <div className="flex-1">
              <label className="text-xs font-semibold text-text">Nom de l'étape</label>
              <input value={nomEtape} onChange={(e) => setNomEtape(e.target.value)} placeholder="Ex : Rédaction" className={inputClass} />
            </div>
            <div className="w-24">
              <label className="text-xs font-semibold text-text">Délai (j)</label>
              <input type="number" min={0} value={delaiEtape} onChange={(e) => setDelaiEtape(e.target.value)} className={inputClass} />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap pb-2.5">
              <input type="checkbox" checked={obligatoireEtape} onChange={(e) => setObligatoireEtape(e.target.checked)} className="w-3.5 h-3.5 accent-activeBtn cursor-pointer" />
              Obligatoire
            </label>
            <button
              type="button"
              onClick={handleAddEtape}
              disabled={!nomEtape.trim() || createEtape.isPending}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-activeBtn disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={16} /> Ajouter
            </button>
          </div>
        </section>

        {/* ---------------- CHECKLIST DES PIÈCES ---------------- */}
        <section>
          <h4 className="text-sm font-bold text-text mb-1">Documents requis (checklist)</h4>
          <p className="text-sm text-text-muted mb-4">Les pièces à fournir pour un dossier de ce type.</p>

          {checklist.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-text-muted">Aucun document requis pour l'instant.</div>
          ) : (
            <ul className="flex flex-col gap-2 mb-4">
              {checklist.map((piece) => (
                <li key={piece.id} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 bg-slate-50">
                  <span className="flex-1 text-sm font-medium text-text">{piece.libelle_piece}</span>

                  <label className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={piece.obligatoire}
                      onChange={(e) => updatePiece.mutateAsync({ id: piece.id, data: { obligatoire: e.target.checked } }).catch(() => toast.error('Modification impossible.'))}
                      className="w-3.5 h-3.5 accent-activeBtn cursor-pointer"
                    />
                    Obligatoire
                  </label>

                  <button
                    type="button"
                    onClick={() => deletePiece.mutateAsync(piece.id).catch(() => toast.error('Suppression impossible.'))}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Formulaire d'ajout de pièce */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-3 rounded-lg border border-slate-100">
            <div className="flex-1">
              <label className="text-xs font-semibold text-text">Libellé de la pièce</label>
              <input value={libellePiece} onChange={(e) => setLibellePiece(e.target.value)} placeholder="Ex : CNI vendeur" className={inputClass} />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap pb-2.5">
              <input type="checkbox" checked={obligatoirePiece} onChange={(e) => setObligatoirePiece(e.target.checked)} className="w-3.5 h-3.5 accent-activeBtn cursor-pointer" />
              Obligatoire
            </label>
            <button
              type="button"
              onClick={handleAddPiece}
              disabled={!libellePiece.trim() || createPiece.isPending}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-activeBtn disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={16} /> Ajouter
            </button>
          </div>
        </section>
      </div>
    </Modal>
  );
};
