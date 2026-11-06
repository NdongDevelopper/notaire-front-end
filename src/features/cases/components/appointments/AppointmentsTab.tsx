import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, MapPin, User, Edit, Trash2, RotateCcw } from 'lucide-react';
import { appointmentService } from '../../services/appointment.service';
import { useAuthStore } from '../../../auth/store/auth.store';
import type { Appointment, AppointmentStatus, AppointmentType } from '../../types/appointment.types';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import { RescheduleModal } from './RescheduleModal';

interface AppointmentsTabProps {
  dossierId: string;
  clients?: Array<{ id: string; name: string }>;
}

const APPOINTMENT_TYPES: Record<AppointmentType, string> = {
  consultation: 'Consultation',
  signature: 'Signature',
  remise_pieces: 'Remise de pièces',
  restitution: 'Restitution / clôture',
  autre: 'Autre',
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  planifie: 'Planifié',
  proposé: 'Proposé',
  confirme: 'Confirmé',
  reporte: 'Report demandé',
  annule: 'Annulé',
  termine: 'Terminé',
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  planifie: 'bg-blue-50 text-blue-700 border-blue-200',
  proposé: 'bg-amber-50 text-amber-700 border-amber-200',
  confirme: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reporte: 'bg-orange-50 text-orange-700 border-orange-200',
  annule: 'bg-red-50 text-red-700 border-red-200',
  termine: 'bg-slate-50 text-slate-700 border-slate-200',
};

export const AppointmentsTab = ({ dossierId, clients = [] }: AppointmentsTabProps) => {
  const { user: currentUser } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = useState<Appointment | null>(null);

  useEffect(() => {
    loadAppointments();
  }, [dossierId]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAppointments(dossierId);
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (appointmentData: any) => {
    try {
      if (appointmentData.id) {
        // Update existing appointment
        const updateData = {
          client: appointmentData.client,
          type_rdv: appointmentData.type_rdv,
          date_heure: appointmentData.date_heure,
          duree_minutes: appointmentData.duree_minutes,
          lieu: appointmentData.lieu,
          objet: appointmentData.objet,
          notes: appointmentData.notes,
        };
        await appointmentService.updateAppointment(appointmentData.id, updateData);
      } else {
        // Create new appointment
        const payload: any = {
          client: appointmentData.client,
          type_rdv: appointmentData.type_rdv,
          date_heure: appointmentData.date_heure,
          duree_minutes: appointmentData.duree_minutes,
          lieu: appointmentData.lieu,
          objet: appointmentData.objet,
          dossier: dossierId,
          // organisateur : le backend affecte request.user si le champ est
          // absent. On n'envoie donc un id que s'il est réellement présent
          // (un fallback `'default'` provoquerait un 400 « invalid pk »).
          ...(currentUser?.id ? { organisateur: currentUser.id } : {}),
        };
        if (appointmentData.notes) {
          payload.notes = appointmentData.notes;
        }
        await appointmentService.createAppointment(payload);
      }
      loadAppointments();
      setIsCreateModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error creating/updating appointment:', error);
      throw error;
    }
  };

  const handleReschedule = async (appointmentId: string, newDate: string, newTime: string) => {
    try {
      // Combine date and time into datetime with proper ISO format
      const date_heure = newTime ? `${newDate}T${newTime}:00` : newDate;
      await appointmentService.updateAppointment(appointmentId, { 
        date_heure,
        statut: 'planifie' as AppointmentStatus
      });
      loadAppointments();
      setIsRescheduleModalOpen(false);
      setSelectedAppointmentForReschedule(null);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      await appointmentService.updateAppointment(appointmentId, { statut: newStatus });
      loadAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const handleDelete = async (appointmentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) return;
    
    try {
      await appointmentService.deleteAppointment(appointmentId);
      loadAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400 text-sm">Chargement des rendez-vous...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">Rendez-vous</h3>
          <p className="text-xs text-slate-500 mt-1">Gérez les rendez-vous pour ce dossier</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all"
        >
          <Plus size={16} />
          Nouveau rendez-vous
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Aucun rendez-vous planifié</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 text-blue-600 text-sm hover:underline"
          >
            Créer un rendez-vous
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={24} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm">{appointment.objet}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[appointment.statut as AppointmentStatus]}`}>
                        {STATUS_LABELS[appointment.statut as AppointmentStatus]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {APPOINTMENT_TYPES[appointment.type_rdv as AppointmentType]}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatDate(appointment.date_heure)} à {formatTime(appointment.date_heure)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{appointment.lieu}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{appointment.client_nom}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Organisé par {appointment.organisateur_nom}</span>
                      </div>
                    </div>

                    {appointment.notes && (
                      <p className="text-xs text-slate-500 italic mt-2">{appointment.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {appointment.statut === 'reporte' && (
                    <button
                      onClick={() => {
                        setSelectedAppointmentForReschedule(appointment);
                        setIsRescheduleModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Replanifier"
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setIsCreateModalOpen(true);
                    }}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(appointment.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {(appointment.statut === 'planifie' || appointment.statut === 'proposé') && currentUser?.id === appointment.client && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => handleStatusChange(appointment.id, 'confirme')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => handleStatusChange(appointment.id, 'annule')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedAppointment(null);
        }}
        onSubmit={handleCreateAppointment}
        clients={clients}
        editAppointment={selectedAppointment}
        currentUserId={currentUser?.id}
      />

      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => {
          setIsRescheduleModalOpen(false);
          setSelectedAppointmentForReschedule(null);
        }}
        onSubmit={handleReschedule}
        appointment={selectedAppointmentForReschedule}
      />
    </div>
  );
};