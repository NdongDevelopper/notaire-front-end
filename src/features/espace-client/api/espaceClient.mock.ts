import type {
  Appointment,
  Client,
  ClientMessage,
  Dossier,
  DossierParty,
  Payment,
  Piece,
  PortalNotification,
  SharedDocument,
} from '../types/client.types';

// ---------------------------------------------------------------------
// Mock data only. Endpoints exist on the backend but aren't documented
// yet (expected soon) — this file stands in until then. Nothing here
// should be imported directly by components; go through
// espaceClient.service.ts so the swap to real endpoints only touches
// one layer.
// ---------------------------------------------------------------------

export const MOCK_CLIENT: Client = {
  id: 'client-1',
  type: 'Personne',
  firstName: 'Amadou',
  lastName: 'Ndiaye',
  phone: '+221 77 123 45 67',
  email: 'amadou.ndiaye@example.sn',
  address: 'Cité Keur Gorgui, Dakar',
  civilStatus: 'Marié',
  createdAt: '2025-11-03T09:00:00Z',
};

export const MOCK_DOSSIERS: Dossier[] = [
  {
    id: 'dossier-1',
    number: '2026-VENTE-0042',
    type: 'Vente',
    responsibleId: 'user-fatou-sarr',
    status: 'Rédaction',
    createdAt: '2026-05-12T09:00:00Z',
    updatedAt: '2026-07-13T14:00:00Z',
    clientStatus: 'En cours de rédaction',
    progression: 55,
    clientAccessEnabled: true,
  },
  {
    id: 'dossier-2',
    number: '2026-SUCC-0018',
    type: 'Succession',
    responsibleId: 'user-fatou-sarr',
    status: 'Pièces en cours',
    createdAt: '2026-03-02T09:00:00Z',
    updatedAt: '2026-06-28T11:30:00Z',
    clientStatus: 'En attente de pièces',
    progression: 25,
    clientAccessEnabled: true,
  },
];

export const MOCK_PARTIES: DossierParty[] = [
  { id: 'party-1', dossierId: 'dossier-1', clientId: 'client-1', role: 'Vendeur' },
  { id: 'party-2', dossierId: 'dossier-2', clientId: 'client-1', role: 'Héritier' },
];

export const MOCK_PIECES: Piece[] = [
  {
    id: 'piece-1',
    dossierId: 'dossier-1',
    name: 'Certificat administratif',
    status: 'Manquante',
    clientStatus: 'À fournir',
    isMandatory: true,
    description: "Document requis pour attester de la situation d'urbanisme du bien.",
    source: 'client',
    clientId: 'client-1',
  },
  {
    id: 'piece-2',
    dossierId: 'dossier-1',
    name: 'Procuration',
    status: 'Manquante',
    clientStatus: 'À fournir',
    isMandatory: true,
    description: "Mandat en cas d'impossibilité de présence à la signature.",
    source: 'client',
    clientId: 'client-1',
  },
  {
    id: 'piece-3',
    dossierId: 'dossier-1',
    name: "Copie de la carte nationale d'identité",
    status: 'Reçue',
    clientStatus: 'Validée',
    isMandatory: true,
    description: "Pièce d'identité en cours de validité.",
    source: 'client',
    clientId: 'client-1',
    uploadedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'piece-4',
    dossierId: 'dossier-2',
    name: 'Acte de décès',
    status: 'Reçue',
    clientStatus: 'En vérification',
    isMandatory: true,
    description: 'Acte officiel requis pour ouvrir la succession.',
    source: 'client',
    clientId: 'client-1',
    uploadedAt: '2026-06-20T08:00:00Z',
  },
  {
    id: 'piece-5',
    dossierId: 'dossier-2',
    name: 'Livret de famille',
    status: 'Manquante',
    clientStatus: 'Rejetée',
    isMandatory: true,
    description: 'Justificatif du lien de parenté avec le défunt.',
    rejectionComment: 'Photocopie illisible — merci de fournir un scan net.',
    source: 'client',
    clientId: 'client-1',
  },
];

export const MOCK_MESSAGES: ClientMessage[] = [
  {
    id: 'msg-1',
    dossierId: 'dossier-1',
    senderId: 'user-fatou-sarr',
    senderName: 'Fatou Sarr',
    content: 'Votre projet d\u2019acte est disponible pour consultation.',
    timestamp: '2026-07-13T09:15:00Z',
    isRead: true,
    isInternalOnly: false,
  },
  {
    id: 'msg-2',
    dossierId: 'dossier-1',
    senderId: 'user-fatou-sarr',
    senderName: 'Fatou Sarr',
    content: 'Bonjour M. Ndiaye, merci de nous transmettre le certificat administratif.',
    timestamp: '2026-07-13T09:20:00Z',
    isRead: false,
    isInternalOnly: false,
  },
];

export const MOCK_DOCUMENTS: SharedDocument[] = [
  {
    id: 'doc-1',
    dossierId: 'dossier-1',
    name: "Projet d'acte de vente",
    type: "Projet d'acte",
    sharedAt: '2026-07-12T10:00:00Z',
    status: 'À relire',
    downloadAllowed: true,
    viewCount: 2,
  },
  {
    id: 'doc-2',
    dossierId: 'dossier-1',
    name: 'Convocation signature',
    type: 'Convocation',
    sharedAt: '2026-07-10T10:00:00Z',
    status: 'Envoyée',
    downloadAllowed: true,
    viewCount: 1,
  },
  {
    id: 'doc-3',
    dossierId: 'dossier-2',
    name: 'Reçu paiement provision',
    type: 'Reçu paiement',
    sharedAt: '2026-06-25T10:00:00Z',
    status: 'Validé',
    downloadAllowed: false,
    viewCount: 0,
  },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-1',
    dossierId: 'dossier-1',
    date: '2026-08-25',
    time: '10:00',
    location: "Étude Notariale — Salle de signature, Plateau, Dakar",
    purpose: "Signature de l'acte de vente",
    status: 'Proposé',
  },
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    dossierId: 'dossier-1',
    amount: 1000000,
    date: '2026-07-14',
    method: 'Virement',
    label: 'Provision complémentaire',
    isRequested: true,
    isPaid: false,
  },
  {
    id: 'pay-2',
    dossierId: 'dossier-1',
    amount: 500000,
    date: '2026-05-15',
    method: 'Virement',
    label: "Provision d'ouverture",
    isRequested: false,
    isPaid: true,
  },
];

export const MOCK_NOTIFICATIONS: PortalNotification[] = [
  {
    id: 'notif-1',
    clientId: 'client-1',
    title: 'Nouveau message',
    content: 'Fatou Sarr vous a envoyé un message.',
    createdAt: '2026-07-13T09:20:00Z',
    isRead: false,
    dossierId: 'dossier-1',
  },
  {
    id: 'notif-2',
    clientId: 'client-1',
    title: 'Pièce rejetée',
    content: 'Le livret de famille a été rejeté.',
    createdAt: '2026-07-10T08:00:00Z',
    isRead: false,
    dossierId: 'dossier-2',
  },
];
