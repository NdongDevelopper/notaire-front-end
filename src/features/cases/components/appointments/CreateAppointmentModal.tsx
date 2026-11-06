import { useState } from 'react';
import { Calendar, Clock, MapPin, User, FileText } from 'lucide-react';
import { Modal } from '../../../../shared/components/ui/Modal/Modal';
import type { Appointment, AppointmentType } from '../../types/appointment.types';

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  clients: Array<{ id: string; name: string }>;
  editAppointment?: Appointment | null;
  currentUserId?: string;
}

const APPOINTMENT_TYPES: Record<AppointmentType, string> = {
  consultation: 'Consultation',
  signature: 'Signature',
  remise_pieces: 'Remise de pièces',
  restitution: 'Restitution / clôture',
  autre: 'Autre',
};

export const CreateAppointmentModal = ({ isOpen, onClose, onSubmit, clients, editAppointment, currentUserId }: CreateAppointmentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    client: editAppointment?.client || '',
    type_rdv: (editAppointment?.type_rdv as AppointmentType) || 'consultation',
    date_heure: editAppointment?.date_heure || '',
    duree_minutes: editAppointment?.duree_minutes || 30,
    lieu: editAppointment?.lieu || 'Étude',
    objet: editAppointment?.objet || '',
    notes: editAppointment?.notes || '',
  });

  const handleSubmit = async () => {
    // Le bouton « Créer » n'est pas un <input type="submit"> : l'attribut HTML
    // `required` ne déclenche pas sa validation. On valide ici pour ne jamais
    // envoyer un payload vide au backend (sinon 400 « champ requis » /
    // « datetime invalide »).
    if (!formData.client || !formData.date_heure) {
      setFormError("Veuillez sélectionner un client ainsi qu'une date et une heure valides.");
      return;
    }
    setFormError(null);
    setLoading(true);
    
    try {
      // Format date_heure to ISO with timezone
      const formattedDate = new Date(formData.date_heure).toISOString();
      const duree_minutes = Number.isFinite(formData.duree_minutes) && formData.duree_minutes > 0
        ? formData.duree_minutes
        : 30;
      
      if (editAppointment) {
        await onSubmit({
          ...formData,
          duree_minutes,
          date_heure: formattedDate,
          id: editAppointment?.id,
        });
      } else {
        await onSubmit({
          ...formData,
          duree_minutes,
          date_heure: formattedDate,
          organisateur: currentUserId,
        });
      }
    } catch (error) {
      console.error('Error submitting appointment:', error);
      setFormError("La création a échoué. Vérifiez les champs (date dans le futur, absence de conflit d'agenda).");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Separate date and time for the input
  const dateValue = formData.date_heure ? formData.date_heure.split('T')[0] : '';
  const timeValue = formData.date_heure ? formData.date_heure.split('T')[1]?.substring(0, 5) || '' : '';

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editAppointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
      size="lg"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-6 py-2 rounded-xl transition-all"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : editAppointment ? 'Modifier' : 'Créer'}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {formError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700">
            {formError}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
            <User size={14} />
            Client
          </label>
          <select
            value={formData.client}
            onChange={(e) => handleChange('client', e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
            <FileText size={14} />
            Type de rendez-vous
          </label>
          <select
            value={formData.type_rdv}
            onChange={(e) => handleChange('type_rdv', e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
            required
          >
            {Object.entries(APPOINTMENT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
              <Calendar size={14} />
              Date
            </label>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => handleChange('date_heure', e.target.value + (timeValue ? `T${timeValue}` : ''))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
              <Clock size={14} />
              Heure
            </label>
            <input
              type="time"
              value={timeValue}
              onChange={(e) => handleChange('date_heure', (dateValue || '') + `T${e.target.value}`)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
            <Clock size={14} />
            Durée (minutes)
          </label>
          <input
            type="number"
            value={formData.duree_minutes}
            onChange={(e) => handleChange('duree_minutes', parseInt(e.target.value))}
            min="15"
            step="15"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
            <MapPin size={14} />
            Lieu
          </label>
          <input
            type="text"
            value={formData.lieu}
            onChange={(e) => handleChange('lieu', e.target.value)}
            placeholder="Étude, bureau, etc."
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
            <FileText size={14} />
            Objet
          </label>
          <input
            type="text"
            value={formData.objet}
            onChange={(e) => handleChange('objet', e.target.value)}
            placeholder="Signature de l'acte, consultation, etc."
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optionnel)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Informations supplémentaires..."
            rows={2}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>
    </Modal>
  );
};