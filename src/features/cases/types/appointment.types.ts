export interface Appointment {
  id: string;
  dossier: string;
  dossier_numero: string;
  client: string;
  client_nom: string;
  organisateur: string;
  organisateur_nom: string;
  type_rdv: string;
  statut: string;
  date_heure: string;
  duree_minutes: number;
  lieu: string;
  objet: string;
  notes: string;
  rappel_envoye: boolean;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus = 'planifie' | 'proposé' | 'confirme' | 'reporte' | 'annule' | 'termine';
// Les valeurs doivent correspondre EXACTEMENT aux choix du backend
// (RendezVous.TypeRdv : consultation | signature | remise_pieces | restitution | autre).
export type AppointmentType = 'consultation' | 'signature' | 'remise_pieces' | 'restitution' | 'autre';

export interface CreateAppointmentPayload {
  dossier: string;
  client: string;
  organisateur?: string;
  type_rdv: AppointmentType;
  statut?: AppointmentStatus;
  date_heure: string;
  duree_minutes: number;
  lieu: string;
  objet: string;
  notes?: string;
}

export interface UpdateAppointmentPayload {
  statut?: AppointmentStatus;
  date_heure?: string;
  duree_minutes?: number;
  lieu?: string;
  objet?: string;
  notes?: string;
}
