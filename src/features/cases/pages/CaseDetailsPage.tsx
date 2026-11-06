import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../../shared/components/ui/Toast/Toast";
import { caseService } from "../services/case.service";
import { api } from "../../../shared/services/api";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { ModalLinkClient } from "../components/ModalLinkClient";
import { AddTaskModal } from "../components/modals/AddTaskModal";
import { EditTaskModal } from "../components/modals/EditTaskModal";
import { AddPaymentModal } from "../components/modals/AddPaymentModal";
import { AddInvoiceModal } from "../components/modals/AddInvoiceModal";
import { AddDocumentModal } from "../components/modals/AddDocumentModal";
import { EditCaseModal } from "../components/modals/EditCaseModal";
import { TaskDetailModal } from "../components/modals/TaskDetailModal";

// Components
import { CaseHeader } from "../components/CaseHeader";
import { CaseTabs } from "../components/CaseTabs";
import { InformationTab } from "../components/information/InformationTab";
import { DocumentsTab } from "../components/documents/DocumentsTab";
import { FinanceTab } from "../components/finance/FinanceTab";
import { TasksTab } from "../components/tasks/TasksTab";
import { JournalTab } from "../components/journal/JournalTab";
import { MessagingTab } from "../components/messaging/MessagingTab";
import { AppointmentsTab } from "../components/appointments/AppointmentsTab";

// Helpers
import { formatApiError, mapDossierToCase, enrichTaskWithUserData } from "../../cases/helpers/mappers";

// Types
import type { CaseStatus, DossierParty, DossierTask, User as UserType } from "../types/case";
import type { ExtendedCase, CaseDetailsPageProps } from "../../cases/types/case-details";
import type { TaskFormData } from "../types/task.types";
import type { Payment, Invoice } from "../types/finance.types";
import type { ChecklistPiece, DocumentWithStatus } from "../types/document.types";
import type { JournalEntry } from "../types/journal.types";

const STATUS_FRONT_TO_BACKEND: Record<CaseStatus, string> = {
  "OUVERT": "ouvert",
  "PIECES_EN_COURS": "pieces_en_cours",
  "REDACTION": "en_redaction",
  "VALIDATION": "validation",
  "SIGNATURE": "signature",
  "FORMALITES": "formalites",
  "CLOTURE": "cloture",
  "ARCHIVE": "archive",
};

// Vocabulaire des statuts de document : le backend (Document.Statut) utilise
// manquante/recue/a_verifier/validee/rejetee/expiree alors que le frontend
// (DocumentRow, statut_calcule) utilise manquant/recu/a_verifier/valide/rejete/
// expiree. Sans traduction : « valide » → 400 « choix invalide » au PATCH, et
// à l'inverse « validee » relu serait retombé sur « Reçu » par défaut.
const STATUT_FRONT_TO_BACKEND: Record<string, string> = {
  manquant: 'manquante',
  recu: 'recue',
  a_verifier: 'a_verifier',
  valide: 'validee',
  rejete: 'rejetee',
  expiree: 'expiree',
};

const STATUT_BACKEND_TO_FRONT: Record<string, string> = {
  manquante: 'manquant',
  recue: 'recu',
  a_verifier: 'a_verifier',
  validee: 'valide',
  rejetee: 'rejete',
  expiree: 'expiree',
};

const ALL_TABS = [
  { id: "informations", label: "Informations" },
  { id: "pieces", label: "Pièces Justificatives (GED)" },
  { id: "finance", label: "Suivi Financier" },
  { id: "taches", label: "Tâches" },
  { id: "rendez-vous", label: "Rendez-vous" },
  { id: "messagerie", label: "Messagerie" },
  { id: "journal", label: "Journal" },
];

export const CaseDetailsPage = ({ onAddClient, onStatusChange }: CaseDetailsPageProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can, userId: currentUserId } = usePermissions();

  // Onglets visibles selon le rôle (CDC §11 pièces / §15 finances) : un onglet
  // dont le contenu serait de toute façon bloqué par canView n'est pas affiché
  // du tout, plutôt que de montrer un écran "accès refusé" après un clic.
  const visibleTabs = ALL_TABS.filter((tab) => {
    if (tab.id === "pieces") return can('voir', 'piece');
    if (tab.id === "finance") return can('voir', 'finance');
    return true;
  });

  // State
  const [currentCase, setCurrentCase] = useState<ExtendedCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("informations");

  const [isLinkClientOpen, setIsLinkClientOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [isEditCaseOpen, setIsEditCaseOpen] = useState(false);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DossierTask | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<DossierTask | null>(null);

  const [tasks, setTasks] = useState<DossierTask[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<DocumentWithStatus[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [, setParties] = useState<DossierParty[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistPiece[]>([]);
  const [usersList, setUsersList] = useState<UserType[]>([]);

  // Computed values
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.montant, 0);
  const totalPaid = payments.reduce((sum, pay) => sum + pay.montant, 0);
  const remainingAmount = totalAmount - totalPaid;

  // Fetch users (liste pour les sélecteurs "Responsable"/"Créé par")
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users/');
        const data = Array.isArray(response.data) ? response.data : (response.data as any).results || [];
        setUsersList(data);
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
      }
    };
    fetchUsers();
  }, []);

  // Fonction pour rafraîchir les données après un ajout de commentaire
  const handleCommentAdded = () => {
    refreshCaseData();
  };

  // Refresh data
  const refreshCaseData = async () => {
    if (!id) return;

    try {
      const dossier = await caseService.getDossier(id);

      const typeActeId = typeof dossier?.type_acte === 'object' && dossier?.type_acte !== null
        ? (dossier.type_acte as any).id
        : dossier?.type_acte;

      let checklist: ChecklistPiece[] = [];
      if (typeActeId) {
        try {
          const checklistRes = await api.get(`/checklist-pieces/?type_acte=${typeActeId}`);
          checklist = Array.isArray(checklistRes.data) ? checklistRes.data : (checklistRes.data as any).results || [];
        } catch (error) {
          console.warn("Impossible de charger la checklist:", error);
        }
      }
      setChecklistItems(checklist);

      // On charge séparément les ressources dont l'accès dépend du rôle
      // (finances, cf. CDC §15) de celles communes à tous ("parties",
      // "documents", "tâches"). Le backend applique lui-même sa propre
      // restriction par rôle sur /paiements/ et /lignes-financieres/ (403
      // pour un rôle non autorisé) — un Promise.all() unique ferait échouer
      // TOUT le chargement du dossier (y compris parties/documents/tâches,
      // auxquels l'utilisateur a bien droit) à cause d'un seul 403 sur les
      // finances. On isole donc les appels finances et on retombe sur un
      // tableau vide en cas d'échec (403 attendu, ou toute autre erreur),
      // plutôt que de faire planter tout l'affichage du dossier.
      const [partiesData, documentsData, tasksData] = await Promise.all([
        caseService.getParties(),
        caseService.getDocuments(),
        caseService.getTaches(),
      ]);

      let paymentsData: unknown[] = [];
      let invoicesData: unknown[] = [];
      if (can('voir', 'finance')) {
        const [paymentsResult, invoicesResult] = await Promise.allSettled([
          caseService.getPaiements(),
          caseService.getLignesFinancieres(),
        ]);
        if (paymentsResult.status === 'fulfilled') {
          paymentsData = paymentsResult.value;
        } else {
          console.warn("Impossible de charger les paiements:", paymentsResult.reason);
        }
        if (invoicesResult.status === 'fulfilled') {
          invoicesData = invoicesResult.value;
        } else {
          console.warn("Impossible de charger les lignes financières:", invoicesResult.reason);
        }
      }

      const dossierParties = partiesData.filter((party: any) => String(party?.dossier || "") === String(id));
      const dossierDocuments = documentsData.filter((document: any) => String(document?.dossier || "") === String(id));
      const dossierTasks = tasksData.filter((task: any) => String(task?.dossier || "") === String(id));
      const dossierPayments = (paymentsData as any[]).filter((payment: any) => String(payment?.dossier || "") === String(id));
      const dossierInvoices = (invoicesData as any[]).filter((invoice: any) => String(invoice?.dossier || "") === String(id));

      // Enrichir les tâches avec les données utilisateur
      const enrichedTasks = dossierTasks.map((task: any) => enrichTaskWithUserData(task, usersList));

      // Construire le journal
      const journalEntries: JournalEntry[] = [];

      if (dossier.created_at) {
        let responsableName = "Système";
        if (dossier.responsable) {
          responsableName = typeof dossier.responsable === 'object' && dossier.responsable !== null
            ? `${dossier.responsable.first_name || ""} ${dossier.responsable.last_name || ""}`.trim() || dossier.responsable.username || "Système"
            : String((dossier as any).responsable_nom || dossier.responsable);
        }
        journalEntries.push({
          id: "creation",
          action: "Création du dossier",
          utilisateur: responsableName,
          created_at: dossier.created_at,
          details: `Dossier créé avec le type ${(dossier as any).type_acte_libelle || (typeof dossier.type_acte === 'object' ? (dossier.type_acte as any).libelle : dossier.type_acte) || "inconnu"}`,
        });
      }

      if (dossier.statut) {
        journalEntries.push({
          id: "status",
          action: "Statut actuel",
          utilisateur: "Système",
          created_at: dossier.created_at || new Date().toISOString(),
          details: `Statut : ${dossier.statut}`,
        });
      }

      dossierDocuments.forEach((doc: any, index: number) => {
        if (doc.created_at) {
          journalEntries.push({
            id: `doc-${index}`,
            action: doc.fichier ? "Document téléversé" : "Document créé",
            utilisateur: doc.uploaded_by || "Utilisateur",
            created_at: doc.created_at,
            details: `${doc.nom} - ${doc.fichier ? "Fichier présent" : "En attente"}`,
          });
        }
      });

      enrichedTasks.forEach((task: any, index: number) => {
        if (task.created_at) {
          const creatorName = task.created_by && typeof task.created_by === 'object'
            ? `${task.created_by.first_name || ''} ${task.created_by.last_name || ''}`.trim() || task.created_by.username || "Utilisateur"
            : "Utilisateur";
          journalEntries.push({
            id: `task-${index}`,
            action: "Tâche créée",
            utilisateur: creatorName,
            created_at: task.created_at,
            details: `${task.titre} - ${task.statut}`,
          });
        }
      });

      dossierPayments.forEach((payment: any, index: number) => {
        if (payment.created_at) {
          journalEntries.push({
            id: `payment-${index}`,
            action: "Paiement enregistré",
            utilisateur: payment.created_by || "Utilisateur",
            created_at: payment.created_at,
            details: `${payment.montant} FCFA - ${payment.mode}`,
          });
        }
      });

      journalEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setJournal(journalEntries);

      // Fusionner les documents avec la checklist
      const mergedDocuments: DocumentWithStatus[] = [];

      // Le statut réel du backend (a_verifier/valide/rejete/expiree) prime toujours ;
      // on ne retombe sur "recu"/"manquant" que si le backend n'a pas encore de statut
      // explicite pour cette pièce (cas legacy / juste après upload).
      const KNOWN_STATUSES = ['manquant', 'recu', 'a_verifier', 'valide', 'rejete', 'expiree'];
      const computeDocStatus = (doc: any): DocumentWithStatus['statut_calcule'] => {
        const hasFile = Boolean(doc?.fichier);
        // Le backend renvoie manquante/recue/validee/... : on normalise vers le
        // vocabulaire frontend (manquant/recu/valide/...) avant le test, sinon
        // un statut au backend correct (« validee ») serait ré-affiché « Reçu ».
        const raw = doc?.statut;
        const normalized = STATUT_BACKEND_TO_FRONT[raw] ?? raw;
        if (normalized && KNOWN_STATUSES.includes(normalized)) {
          return normalized as DocumentWithStatus['statut_calcule'];
        }
        return hasFile ? 'recu' : 'manquant';
      };

      if (checklist.length > 0) {
        const matchedDocIds = new Set<string>();

        checklist.forEach((item) => {
          const checklistLabel = String(item?.nom ?? "").toLowerCase();
          const existingDoc = dossierDocuments.find((doc: any) => {
            const documentName = String(doc?.nom ?? "").toLowerCase();
            return doc.type_piece === item.type_piece || documentName.includes(checklistLabel);
          });

          if (existingDoc) {
            matchedDocIds.add(String(existingDoc.id));
            mergedDocuments.push({
              ...existingDoc,
              statut_calcule: computeDocStatus(existingDoc),
              nom_checklist: item.nom,
              obligatoire: item.obligatoire,
              type_piece: item.type_piece,
            });
          } else {
            mergedDocuments.push({
              id: `checklist-${item.id}`,
              dossier: id,
              nom: item.nom,
              statut: 'manquant',
              statut_calcule: 'manquant',
              nom_checklist: item.nom,
              obligatoire: item.obligatoire,
              type_piece: item.type_piece,
              created_at: '',
            } as DocumentWithStatus);
          }
        });

        // Pièces créées manuellement (bouton "Ajouter une pièce") qui ne
        // correspondent à AUCUN item de la checklist attendue pour ce type
        // d'acte : sans ce bloc, elles sont bien créées côté backend mais
        // disparaissent silencieusement de l'affichage (bug corrigé ici).
        // On les affiche à la suite, sans nom_checklist/obligatoire puisqu'elles
        // sont hors checklist par définition.
        dossierDocuments.forEach((doc: any) => {
          if (!matchedDocIds.has(String(doc.id))) {
            mergedDocuments.push({
              ...doc,
              statut_calcule: computeDocStatus(doc),
            });
          }
        });
      } else {
        mergedDocuments.push(...dossierDocuments.map((doc: any) => ({
          ...doc,
          statut_calcule: computeDocStatus(doc),
        })));
      }

      setCurrentCase(mapDossierToCase({ ...dossier, parties: dossierParties }, id));
      setParties(dossierParties);
      setDocuments(mergedDocuments);
      setTasks(enrichedTasks);
      setPayments(dossierPayments.map((payment: any) => ({
        id: String(payment?.id || Date.now()),
        categorie: payment?.categorie || "Paiement",
        montant: Number(payment?.montant) || 0,
        date_paiement: payment?.date_paiement || payment?.created_at || "",
        mode: payment?.mode || "",
        reference: payment?.reference || payment?.numero || "",
      })));
      setInvoices(dossierInvoices.map((invoice: any) => ({
        id: String(invoice?.id || Date.now()),
        categorie: invoice?.categorie || "honoraires",
        montant: Number(invoice?.montant) || 0,
        libelle: invoice?.libelle || invoice?.description || "",
      })));
    } catch (error) {
      console.error(error);
      toast.error("Impossible de récupérer les données du dossier.");
    }
  };

  // Fetch case details
  useEffect(() => {
    let isMounted = true;

    const fetchCaseDetails = async () => {
      if (!id) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        if (isMounted) setLoading(true);
        await refreshCaseData();
      } catch (error) {
        console.error(error);
        if (isMounted) toast.error("Impossible de récupérer les données du dossier.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCaseDetails();
    return () => { isMounted = false; };
  }, [id]);

  // ---- HANDLERS ----
  const handleAddTaskSubmit = async (taskData: TaskFormData) => {
    if (!id) return;
    if (!can('creer', 'tache')) {
      toast.error("Vous n'avez pas les permissions nécessaires pour créer une tâche.");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        dossier: id,
        titre: taskData.titre,
        statut: taskData.statut || "a_faire",
        priorite: taskData.priorite || "normale",
      };
      if (taskData.description.trim()) payload.description = taskData.description.trim();
      if (taskData.assigne_a.trim()) payload.assigne_a = taskData.assigne_a;
      if (taskData.date_echeance.trim()) payload.date_echeance = taskData.date_echeance;

      await caseService.createTache(payload);
      await refreshCaseData();
      toast.success("Tâche ajoutée avec succès !");
      setIsAddTaskOpen(false);
    } catch (error: any) {
      console.error("Erreur création tâche:", error?.response?.data);
      toast.error(formatApiError(error, "Erreur lors de l'ajout de la tâche."));
    }
  };

  const handleEditTaskSubmit = async (taskData: TaskFormData) => {
    if (!id || !editingTask?.id) return;
    try {
      const payload: Record<string, unknown> = {
        titre: taskData.titre,
        statut: taskData.statut,
        priorite: taskData.priorite,
      };
      if (taskData.description.trim()) payload.description = taskData.description.trim();
      if (taskData.assigne_a.trim()) payload.assigne_a = taskData.assigne_a;
      if (taskData.date_echeance.trim()) payload.date_echeance = taskData.date_echeance;

      await caseService.updateTache(editingTask.id, payload);
      await refreshCaseData();
      toast.success("Tâche modifiée avec succès !");
      setIsEditTaskOpen(false);
      setEditingTask(null);
    } catch (error: any) {
      console.error("Erreur modification tâche:", error?.response?.data);
      toast.error(formatApiError(error, "Erreur lors de la modification de la tâche."));
    }
  };

  const handleDeleteTask = async (taskId: string | number) => {
    if (!can('supprimer', 'tache')) {
      toast.error("Vous n'avez pas les permissions nécessaires pour supprimer une tâche.");
      return;
    }
    if (!window.confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;
    try {
      await caseService.deleteTache(taskId);
      await refreshCaseData();
      toast.success("Tâche supprimée avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la suppression de la tâche.");
    }
  };

  const handleEditCaseSubmit = async (updates: {
    objet: string;
    type_acte: number;
    montant: number;
    date_cible: string;
    priorite: "basse" | "normale" | "haute";
    description: string;
    responsable?: string;
    client?: string;
  }) => {
    if (!id) return;
    try {
      const payload: any = {
        objet: updates.objet,
        type_acte: updates.type_acte,
        montant: updates.montant,
        date_cible: updates.date_cible,
        priorite: updates.priorite,
        description: updates.description,
      };

      if (updates.responsable) {
        payload.responsable = updates.responsable;
      }
      if (updates.client) {
        payload.client = updates.client;
      }

      const updatedDossier = await caseService.updateDossier(id, payload);
      setCurrentCase(mapDossierToCase({ ...updatedDossier, parties: currentCase?.clients }, id));
      toast.success("Dossier mis à jour avec succès !");
      setIsEditCaseOpen(false);
    } catch (error: any) {
      toast.error(formatApiError(error, "Erreur lors de la mise à jour du dossier."));
    }
  };

  const handleDeleteCase = async () => {
    if (!id) return;
    if (!can('supprimer', 'dossier')) {
      toast.error("Vous n'avez pas les permissions nécessaires pour supprimer ce dossier.");
      return;
    }
    if (!window.confirm("Voulez-vous vraiment supprimer ce dossier ? Cette action est irréversible.")) return;
    try {
      await caseService.deleteDossier(id);
      toast.success("Dossier supprimé avec succès.");
      navigate("/dashboard/dossiers");
    } catch (error: any) {
      toast.error(formatApiError(error, "Erreur lors de la suppression du dossier."));
    }
  };

  const handleStatusChange = async (newStatus: CaseStatus) => {
    if (!id || !currentCase) return;
    try {
      const updatedDossier = await caseService.updateDossier(id, { statut: STATUS_FRONT_TO_BACKEND[newStatus] });
      setCurrentCase(mapDossierToCase(updatedDossier, id));
      onStatusChange(currentCase.id, newStatus);
      toast.success(`Statut mis à jour vers : ${newStatus}`);
    } catch (error) {
      toast.error("Erreur réseau lors du changement de statut.");
    }
  };

  const handleAddClientSubmit = async (clientId: string, role: string) => {
    if (!clientId.trim() || !id) return;
    try {
      const createdParty = await caseService.createParty({ dossier: id, client: clientId, role });
      if (createdParty) await refreshCaseData();
      onAddClient(currentCase!.id, clientId, role);
      setIsLinkClientOpen(false);
      toast.success("Partie liée au dossier avec succès !");
    } catch (error: any) {
      console.error("Détail erreur 400 /parties/ :", error?.response?.data);
      toast.error(formatApiError(error, "Erreur réseau lors de l'ajout de la partie."));
    }
  };

  const handleAddPaymentSubmit = async (payment: { montant: string; date_paiement: string; mode: string; reference: string }) => {
    const parsedAmount = parseFloat(payment.montant) || 0;
    if (!id) return;
    try {
      const createdPayment = await caseService.createPaiement({
        dossier: id,
        montant: parsedAmount,
        date_paiement: payment.date_paiement,
        mode: payment.mode,
        reference: payment.reference,
      });

      setPayments((prev) => [...prev, {
        id: String((createdPayment as any)?.id || Date.now()),
        categorie: (createdPayment as any)?.categorie || "Paiement",
        montant: Number((createdPayment as any)?.montant) || parsedAmount,
        date_paiement: (createdPayment as any)?.date_paiement || payment.date_paiement,
        mode: (createdPayment as any)?.mode || payment.mode,
        reference: (createdPayment as any)?.reference || payment.reference,
      }]);
      setIsAddPaymentOpen(false);
      toast.success("Paiement enregistré sur le serveur !");
    } catch (error: any) {
      toast.error(formatApiError(error, "Erreur lors de l'enregistrement du paiement."));
    }
  };

  const handleAddInvoiceSubmit = async (invoice: { categorie: string; montant: string; libelle: string }) => {
    const parsedAmount = parseFloat(invoice.montant) || 0;
    if (!id) return;
    try {
      await caseService.createLigneFinanciere({ dossier: id, categorie: invoice.categorie, montant: parsedAmount, libelle: invoice.libelle });
      await refreshCaseData();
      setIsAddInvoiceOpen(false);
      toast.success("Ligne financière ajoutée avec succès !");
    } catch (error: any) {
      toast.error(formatApiError(error, "Erreur lors de la création de la ligne financière."));
    }
  };

  const handleAddDocument = async (document: { nom: string; type_piece: string; obligatoire: boolean }) => {
    if (!id) return;
    if (!can('creer', 'piece')) {
      toast.error("Vous n'avez pas les permissions nécessaires pour ajouter une pièce.");
      return;
    }
    try {
      await caseService.createDocument({ dossier: id, nom: document.nom, type_piece: document.type_piece || "autre" });
      toast.success("Pièce créée avec succès !");
      await refreshCaseData();
    } catch (error: any) {
      toast.error(formatApiError(error, "Erreur lors de la création de la pièce."));
    }
  };

  const handleUploadDocument = (docId: string) => {
    if (!can('creer', 'piece') && !can('modifier', 'piece')) {
      toast.error("Vous n'avez pas les permissions nécessaires pour téléverser une pièce.");
      return;
    }
    const isChecklistId = typeof docId === 'string' && docId.startsWith('checklist-');

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !id) return;

      try {
        if (isChecklistId) {
          const checklistItem = checklistItems.find((item) => `checklist-${item.id}` === docId);
          if (checklistItem) {
            const newDoc = await caseService.createDocument({ dossier: id, nom: checklistItem.nom, type_piece: checklistItem.type_piece });
            await caseService.uploadDocumentFile(String(newDoc.id), file);
          }
        } else {
          await caseService.uploadDocumentFile(docId, file);
        }
        toast.success("Fichier téléversé avec succès !");
        await refreshCaseData();
      } catch (error: any) {
        toast.error(formatApiError(error, "Erreur lors du téléversement du fichier."));
      }
    };
    input.click();
  };

  const handleChangeDocumentStatus = async (docId: string, statut: string) => {
    if (!can('modifier', 'piece') && !can('creer', 'piece')) {
      toast.error("Vous n'avez pas les permissions nécessaires pour changer le statut de cette pièce.");
      return;
    }
    try {
      // Le backend Document.Statut attend validee/recue/manquante/rejetee/expiree
      // (pas valide/recu/...) — traduit ici pour éviter le 400 « choix invalide ».
      await caseService.updateDocument(docId, { statut: STATUT_FRONT_TO_BACKEND[statut] ?? statut });
      await refreshCaseData();
      toast.success("Statut de la pièce mis à jour.");
    } catch (error: any) {
      toast.error(formatApiError(error, "Erreur lors de la mise à jour du statut de la pièce."));
    }
  };

  const handleShareDocument = async (docId: string) => {
    if (!can('voir', 'piece')) {
      toast.error("Vous n'avez pas les permissions nécessaires pour partager cette pièce.");
      return;
    }
    try {
      const result = await caseService.shareDocument(docId);
      
      // Copy the share URL to clipboard
      if (result.shared_url) {
        await navigator.clipboard.writeText(result.shared_url);
        toast.success("Lien de partage copié dans le presse-papier !");
      } else {
        toast.success("Document partagé avec succès !");
      }
    } catch (error: any) {
      console.error("Erreur lors du partage du document:", error);
      if (error?.response?.status === 404) {
        toast.error("L'endpoint de partage n'est pas encore disponible sur le backend.");
      } else {
        toast.error(formatApiError(error, "Erreur lors du partage du document."));
      }
    }
  };

  const handleMarkActeSigne = async (docId: string) => {
    if (!can('modifier', 'piece') && !can('creer', 'piece')) {
      toast.error("Vous n'avez pas les permissions nécessaires pour marquer cette pièce comme acte signé.");
      return;
    }
    try {
      // PATCH /api/documents/{id}/ — le backend (DocumentViewSet.perform_update)
      // scelle automatiquement le document dès que categorie = "acte_signe"
      // (service idempotent, integrite/services.creer_bloc).
      await caseService.updateDocument(docId, { categorie: 'acte_signe' });
      await refreshCaseData();
      toast.success("Document marqué comme acte signé — scellement d'intégrité déclenché.");
    } catch (error: any) {
      toast.error(formatApiError(error, "Impossible de marquer ce document comme acte signé."));
    }
  };

  const handleDownloadDocument = async (docId: string) => {
    if (!can('voir', 'piece')) {
      toast.error("Vous n'avez pas les permissions nécessaires pour consulter cette pièce.");
      return;
    }
    try {
      const { blob, filename, url } = await caseService.downloadDocument(docId);
      if (blob) {
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(objectUrl);
      } else {
        // Le fetch en blob a échoué (probablement CORS sur /media, non couvert
        // par le proxy /api). Navigation directe : le navigateur ouvre/télécharge
        // le fichier sans passer par un fetch scripté, donc pas soumis au CORS.
        window.open(url, '_blank', 'noopener,noreferrer');
        toast.info("Le fichier s'ouvre dans un nouvel onglet.");
      }
    } catch (error) {
      toast.error("Erreur lors du téléchargement du document.");
    }
  };

  // Loading state
  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement du dossier en cours...</div>;
  }

  // Not found state
  if (!currentCase) {
    return (
      <div className="p-4 md:p-8 text-slate-500">
        <button onClick={() => navigate("/dashboard/dossiers")} className="text-blue-600 mb-4 block hover:underline">
          ← Retour aux dossiers
        </button>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
          <p className="font-semibold text-slate-700">Dossier introuvable ({id}).</p>
        </div>
      </div>
    );
  }

  // Render
  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      <CaseHeader
        caseId={currentCase.id}
        caseType={currentCase.type}
        status={currentCase.status}
        onStatusChange={handleStatusChange}
        onEdit={() => setIsEditCaseOpen(true)}
        onDelete={handleDeleteCase}
        onBack={() => navigate("/dashboard/dossiers")}
        canEdit={can('modifier', 'dossier')}
        canDelete={can('supprimer', 'dossier')}
      />

      <CaseTabs tabs={visibleTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mb-6">
        {activeTab === "informations" && (
          <InformationTab
            responsible={currentCase.responsible}
            createdAt={currentCase.createdAt}
            type={currentCase.type}
            clients={currentCase.clients}
            onAddClient={() => setIsLinkClientOpen(true)}
          />
        )}

        {activeTab === "pieces" && (
          <DocumentsTab
            documents={documents}
            checklistItemsLength={checklistItems.length}
            onAddDocument={() => setIsAddDocumentOpen(true)}
            onUploadDocument={handleUploadDocument}
            onDownloadDocument={handleDownloadDocument}
            onShareDocument={handleShareDocument}
            onMarkActeSigne={handleMarkActeSigne}
            onChangeStatus={handleChangeDocumentStatus}
            canCreate={can('creer', 'piece')}
            canModify={can('modifier', 'piece')}
            canView={can('voir', 'piece')}
          />
        )}

        {activeTab === "finance" && (
          <FinanceTab
            invoices={invoices}
            payments={payments}
            totalAmount={totalAmount}
            totalPaid={totalPaid}
            remainingAmount={remainingAmount}
            onAddInvoice={() => setIsAddInvoiceOpen(true)}
            onAddPayment={() => setIsAddPaymentOpen(true)}
            canView={can('voir', 'finance')}
            canCreate={can('creer', 'finance')}
          />
        )}

        {activeTab === "taches" && (
          <TasksTab
            tasks={tasks}
            usersList={usersList}
            currentUserId={currentUserId}
            canCreate={can('creer', 'tache')}
            canModify={can('modifier', 'tache')}
            canDelete={can('supprimer', 'tache')}
            onAddTask={() => setIsAddTaskOpen(true)}
            onViewTask={(task) => {
              setViewingTask(task);
              setIsTaskDetailOpen(true);
            }}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsEditTaskOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeTab === "rendez-vous" && (
          <AppointmentsTab
            dossierId={id || ''}
            clients={currentCase?.clients}
          />
        )}

        {activeTab === "messagerie" && (
          <MessagingTab
            dossierId={id || ''}
            clientName={currentCase?.clients?.[0]?.name}
            clientId={currentCase?.clients?.[0]?.id}
          />
        )}

        {activeTab === "journal" && <JournalTab entries={journal} />}
      </div>

      {/* Modals */}
      <ModalLinkClient isOpen={isLinkClientOpen} onClose={() => setIsLinkClientOpen(false)} onConfirm={handleAddClientSubmit} />
      <AddTaskModal isOpen={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)} onAdd={handleAddTaskSubmit} usersList={usersList} />
      <EditTaskModal
        isOpen={isEditTaskOpen}
        onClose={() => { setIsEditTaskOpen(false); setEditingTask(null); }}
        task={editingTask}
        onSave={handleEditTaskSubmit}
        usersList={usersList}
        currentUserId={currentUserId}
      />
      <AddPaymentModal isOpen={isAddPaymentOpen} onClose={() => setIsAddPaymentOpen(false)} onAdd={handleAddPaymentSubmit} />
      <AddInvoiceModal isOpen={isAddInvoiceOpen} onClose={() => setIsAddInvoiceOpen(false)} onAdd={handleAddInvoiceSubmit} />
      <AddDocumentModal isOpen={isAddDocumentOpen} onClose={() => setIsAddDocumentOpen(false)} onAdd={handleAddDocument} />
      {id && <EditCaseModal isOpen={isEditCaseOpen} onClose={() => setIsEditCaseOpen(false)} dossierId={id} onSave={handleEditCaseSubmit} />}
      <TaskDetailModal
        isOpen={isTaskDetailOpen}
        onClose={() => { setIsTaskDetailOpen(false); setViewingTask(null); }}
        task={viewingTask}
        currentUserId={currentUserId}
        onCommentAdded={handleCommentAdded}
        usersList={usersList}
      />
    </div>
  );
};