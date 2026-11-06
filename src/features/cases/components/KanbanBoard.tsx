import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '../../../shared/components/ui/Toast/Toast';
import { caseService } from '../services/case.service';
import type { Case, CaseStatus } from '../types/case';

interface KanbanBoardProps {
  onStatusChange: (caseId: string, newStatus: CaseStatus) => void;
}

export const KanbanBoard = ({ onStatusChange }: KanbanBoardProps) => {
  const toast = useToast();
  const [kanbanCases, setKanbanCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Drag-and-drop maison (pointer events), pas de HTML5 draggable natif ---
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const draggingIdRef = useRef<string | null>(null);
  const overColumnRef = useRef<string | null>(null);
  const kanbanCasesRef = useRef<Case[]>([]);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // CORRECTION : Changement de type vers HTMLElement | null pour éviter le bug strict de "align"
  const dragElementRef = useRef<HTMLElement | null>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    kanbanCasesRef.current = kanbanCases;
  }, [kanbanCases]);

  const statusMap: Record<string, string> = {
    ouvert: 'OUVERT',
    pieces_en_cours: 'PIÈCES EN COURS',
    en_redaction: 'RÉDACTION',
    validation: 'VALIDATION',
    signature: 'SIGNATURE',
    formalites: 'FORMALITÉS',
    cloture: 'CLÔTURE',
    archive: 'ARCHIVE',
  };

  const columns: { key: string; label: string }[] = [
    { key: 'OUVERT', label: 'OUVERT' },
    { key: 'PIÈCES EN COURS', label: 'PIÈCES EN COURS' },
    { key: 'RÉDACTION', label: 'RÉDACTION' },
    { key: 'VALIDATION', label: 'VALIDATION' },
    { key: 'SIGNATURE', label: 'SIGNATURE' },
    { key: 'FORMALITÉS', label: 'FORMALITÉS' },
    { key: 'CLÔTURE', label: 'CLÔTURE' },
    { key: 'ARCHIVE', label: 'ARCHIVE' },
  ];

  const toKanbanCase = (dossier: any): Case => {
    const normalizedStatus = typeof dossier?.statut === 'string'
      ? statusMap[dossier.statut.toLowerCase()] || dossier.statut.toUpperCase()
      : 'OUVERT';

    const typeActe = dossier?.type_acte;
    const typeLabel = dossier?.type_acte_libelle
      || (typeof typeActe === 'object' && typeActe !== null ? typeActe.libelle : String(typeActe || dossier?.objet || 'Dossier'));

    const responsible = dossier?.responsable;
    const responsibleLabel = dossier?.responsable_nom
      || (typeof responsible === 'object' && responsible !== null
        ? `${responsible.first_name || ''} ${responsible.last_name || ''}`.trim() || responsible.username || 'Non assigné'
        : String(responsible || 'Non assigné'));

    const clients = Array.isArray(dossier?.parties)
      ? dossier.parties.map((party: any, index: number) => ({
          id: String(party?.id ?? `${dossier?.id}-${index}`),
          name: party?.nom || party?.client?.nom || `Client ${index + 1}`,
          role: party?.role || 'Partie',
        }))
      : dossier?.client_nom
        ? [{ id: String(dossier?.client ?? `${dossier?.id}-0`), name: dossier.client_nom, role: 'Client' }]
        : [];

    return {
      id: String(dossier?.id || ''),
      numero: dossier?.numero,
      objet: dossier?.objet,
      type: typeLabel,
      status: normalizedStatus as CaseStatus,
      responsible: responsibleLabel,
      priority: dossier?.priorite,
      createdAt: dossier?.created_at || dossier?.date_cible || '—',
      clients,
    };
  };

  const loadKanban = async () => {
    try {
      setIsLoading(true);
      const dossiers = await caseService.getKanbanDossiers();
      setKanbanCases(dossiers.map(toKanbanCase));
    } catch (error: any) {
      console.error('Erreur lors du chargement du kanban :', error);
      toast.error(error?.response?.data?.detail || 'Impossible de charger le kanban.');
      setKanbanCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKanban();
  }, []);

  const applyStatusUpdate = async (caseId: string, targetStatusKey: string) => {
    const mappedStatus = Object.entries(statusMap).find(([, value]) => value === targetStatusKey)?.[0];
    if (!mappedStatus) return;

    const previousCases = kanbanCasesRef.current;
    try {
      await caseService.updateDossier(caseId, { statut: mappedStatus });
      const dossiers = await caseService.getKanbanDossiers();
      setKanbanCases(dossiers.map(toKanbanCase));
      onStatusChange(caseId, targetStatusKey as CaseStatus);
      toast.success(`Statut mis à jour : ${targetStatusKey}`);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut du dossier :', error);
      setKanbanCases(previousCases);
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Erreur lors de la mise à jour du statut.';
      toast.error(message);
    }
  };

  // Création du ghost pour le drag
  const createDragGhost = (e: React.PointerEvent, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const ghost = element.cloneNode(true) as HTMLElement;
    
    // Style du ghost
    ghost.style.position = 'fixed';
    ghost.style.width = `${rect.width}px`;
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.opacity = '0.9';
    ghost.style.transform = 'scale(1.05) rotate(-2deg)';
    ghost.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.1)';
    ghost.style.borderRadius = '12px';
    ghost.style.transition = 'none';
    
    // Position initiale
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    ghost.style.left = `${e.clientX - offsetX}px`;
    ghost.style.top = `${e.clientY - offsetY}px`;
    
    document.body.appendChild(ghost);
    dragGhostRef.current = ghost as HTMLDivElement;
    setDragOffset({ x: offsetX, y: offsetY });
    
    return ghost;
  };

  // Démarrage du glisser
  const handlePointerDown = (e: React.PointerEvent, caseId: string) => {
    const target = e.target as HTMLElement;
    if (target.closest('select, option, button, input, textarea')) {
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    e.preventDefault();
    
    // Récupérer l'élément parent avec l'attribut data-card-id
    const cardElement = target.closest('[data-card-id]');
    
    // Vérifier que l'élément existe
    if (!cardElement) {
      return;
    }
    
    // CORRECTION : Cast en HTMLElement standard pour contourner l'erreur TS sur HTMLDivElement
    const card = cardElement as HTMLElement;

    // Sauvegarder la référence de la carte
    dragElementRef.current = card;

    // Créer le ghost
    const ghost = createDragGhost(e, card);
    if (ghost) {
      // Masquer la carte originale
      card.style.opacity = '0.3';
      card.style.transform = 'scale(0.95)';
    }

    draggingIdRef.current = caseId;
    setDraggingId(caseId);
    setIsDragging(true);
  };

  useEffect(() => {
    if (!draggingId) return;

    const handlePointerMove = (e: PointerEvent) => {
      // Déplacer le ghost
      if (dragGhostRef.current && dragOffset) {
        dragGhostRef.current.style.left = `${e.clientX - dragOffset.x}px`;
        dragGhostRef.current.style.top = `${e.clientY - dragOffset.y}px`;
      }

      // Détecter la colonne survolée
      let found: string | null = null;
      for (const [key, el] of Object.entries(columnRefs.current)) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          found = key;
          break;
        }
      }
      overColumnRef.current = found;
      setOverColumn(found);
    };

    const handlePointerUp = () => {
      const caseId = draggingIdRef.current;
      const targetStatus = overColumnRef.current;

      // Supprimer le ghost
      if (dragGhostRef.current) {
        dragGhostRef.current.remove();
        dragGhostRef.current = null;
      }

      // Restaurer la carte originale
      if (dragElementRef.current) {
        dragElementRef.current.style.opacity = '1';
        dragElementRef.current.style.transform = 'scale(1)';
        dragElementRef.current = null;
      }

      // Réinitialiser les états
      draggingIdRef.current = null;
      overColumnRef.current = null;
      setDraggingId(null);
      setOverColumn(null);
      setIsDragging(false);
      setDragOffset(null);

      if (caseId && targetStatus) {
        applyStatusUpdate(caseId, targetStatus);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      
      // Nettoyer le ghost si présent
      if (dragGhostRef.current) {
        dragGhostRef.current.remove();
        dragGhostRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId]);

  const handleStatusSelect = async (caseId: string, selectedStatus: string) => {
    await applyStatusUpdate(caseId, selectedStatus);
  };

  // Déterminer la classe CSS pour une colonne en fonction de l'état de survol
  const getColumnClassName = (columnKey: string) => {
    const isOver = overColumn === columnKey;
    const baseClasses = 'rounded-2xl border p-4 w-full lg:w-[290px] shrink-0 flex flex-col lg:max-h-[calc(100vh-240px)] transition-all duration-300';
    
    if (isOver && draggingId) {
      return `${baseClasses} bg-blue-100/70 border-blue-400 shadow-lg shadow-blue-200/50 scale-[1.02]`;
    }
    if (isOver) {
      return `${baseClasses} bg-blue-50/50 border-blue-300 shadow-inner scale-[1.01]`;
    }
    return `${baseClasses} bg-slate-100/60 border-slate-100 shadow-sm hover:border-slate-200`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 pb-4 pt-1 items-start w-full relative">
      {/* Indicateur visuel global de drag */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-500/5 pointer-events-none z-40 transition-opacity duration-300" />
      )}

      {columns.map((column) => {
        const filteredCases = kanbanCases.filter((c) => c.status === column.key);
        const isOver = overColumn === column.key;

        return (
          <div
            key={column.key}
            ref={(el) => { 
              columnRefs.current[column.key] = el; 
            }}
            className={getColumnClassName(column.key)}
          >
            <div className="flex justify-between items-center mb-4 px-1 select-none">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {column.label}
              </span>
              <span className={`w-5 h-5 flex items-center justify-center rounded-full font-bold text-[11px] transition-all duration-300 ${
                isOver && draggingId
                  ? 'bg-blue-500 text-white scale-110'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {filteredCases.length}
              </span>
            </div>

            <div className="space-y-3 lg:overflow-y-auto pr-1 flex-1 min-h-[120px] scrollbar-thin">
              {filteredCases.map((item) => (
                <div
                  key={item.id}
                  data-card-id={item.id}
                  onPointerDown={(e) => handlePointerDown(e, item.id)}
                  style={{ touchAction: 'none' }}
                  className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 relative group ${
                    draggingId === item.id
                      ? 'border-blue-400 shadow-lg shadow-blue-200/50 scale-[0.95] opacity-30'
                      : 'border-slate-100 hover:border-slate-300 hover:shadow-lg'
                  } ${isDragging && draggingId !== item.id ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                >
                  {/* Indicateur de drag pour la carte */}
                  {draggingId !== item.id && (
                    <div className="absolute top-2 right-2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="12" r="1" />
                        <circle cx="9" cy="5" r="1" />
                        <circle cx="9" cy="19" r="1" />
                        <circle cx="15" cy="12" r="1" />
                        <circle cx="15" cy="5" r="1" />
                        <circle cx="15" cy="19" r="1" />
                      </svg>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 uppercase border border-blue-100 truncate max-w-[120px]">
                      {item.type}
                    </span>
                    <button className="text-slate-300 hover:text-slate-500 font-bold text-xs md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      •••
                    </button>
                  </div>

                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-slate-900 mb-1 select-none break-all">
                      {item.numero || item.id}
                    </h4>
                    {item.objet && (
                      <p className="text-[12px] text-slate-600 leading-5 break-words line-clamp-2">
                        {item.objet}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mb-3">
                    <div>
                      <span className="font-semibold text-slate-700 block">Responsable</span>
                      <p className="truncate">{item.responsible}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 block">Priorité</span>
                      <p>{item.priority || '—'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 block">Date cible</span>
                      <p>{item.createdAt}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 block">Type</span>
                      <p className="truncate">{item.type}</p>
                    </div>
                  </div>

                  <div className="block md:hidden mb-3">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusSelect(item.id, e.target.value)}
                      className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-600 focus:outline-none focus:border-blue-400"
                    >
                      <option value={item.status}>{item.status}</option>
                      {columns
                        .filter((col) => col.key !== item.status)
                        .map((col) => (
                          <option key={col.key} value={col.key}>
                            Déplacer vers : {col.label}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium border-t border-slate-50 pt-2.5">
                    <div className="flex -space-x-1.5">
                      {item.clients?.map((client, index) => (
                        <span
                          key={client.id}
                          title={client.name}
                          className={`w-5 h-5 rounded-full border border-white flex items-center justify-center text-[9px] font-bold text-slate-600 uppercase select-none ${
                            index % 2 === 0 ? 'bg-slate-100' : 'bg-slate-200'
                          }`}
                        >
                          {client.name.charAt(0)}
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1 text-slate-400 text-[11px] select-none shrink-0">
                      {item.createdAt}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading ? (
                <div className="text-center py-8 text-xs font-medium text-slate-300 italic border border-dashed border-slate-200 rounded-xl bg-white/40 pointer-events-none select-none">
                  Chargement...
                </div>
              ) : filteredCases.length === 0 ? (
                <div className={`text-center py-8 text-xs font-medium border border-dashed rounded-xl bg-white/40 pointer-events-none select-none transition-all duration-300 ${
                  isOver && draggingId
                    ? 'text-blue-400 border-blue-300 bg-blue-50/30'
                    : 'text-slate-300 border-slate-200'
                }`}>
                  {isOver && draggingId ? '📥 Déposer ici' : 'Aucun dossier'}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};