import { useState } from 'react';
import { Calendar, Clock, RotateCcw } from 'lucide-react';
import { Modal } from '../../../../shared/components/ui/Modal/Modal';
import type { Appointment } from '../../types/appointment.types';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appointmentId: string, newDate: string, newTime: string) => Promise<void>;
  appointment: Appointment | null;
}

export const RescheduleModal = ({ isOpen, onClose, onSubmit, appointment }: RescheduleModalProps) => {
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const handleSubmit = async () => {
    if (!appointment) return;
    
    setLoading(true);
    
    try {
      await onSubmit(appointment.id, newDate, newTime);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Replanifier le rendez-vous"
      size="md"
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
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-6 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Replanification...' : 'Replanifier'}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-orange-50 p-2.5 rounded-lg">
          <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
            <RotateCcw size={16} />
          </div>
          <p className="text-xs text-orange-800">Client a demandé un report</p>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg space-y-1.5">
          <p className="text-xs font-medium text-slate-700">Rendez-vous actuel :</p>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={14} />
            <span>{new Date(appointment.date_heure).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock size={14} />
            <span>{new Date(appointment.date_heure).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
              <Calendar size={14} />
              Nouvelle date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
              <Clock size={14} />
              Nouvelle heure
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-600"
              required
            />
          </div>
        </div>

        <div className="bg-orange-50 p-2.5 rounded-lg border border-orange-200">
          <p className="text-xs text-orange-800">
            <strong>Note :</strong> Le client sera notifié du nouveau créneau horaire.
          </p>
        </div>
      </div>
    </Modal>
  );
};