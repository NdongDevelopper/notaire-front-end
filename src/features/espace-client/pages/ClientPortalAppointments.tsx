import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { PortalPageHeader } from '../components/PortalPageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useEspaceClientData } from '../context/EspaceClientDataContext';

type AppointmentStatus = 'planifie' | 'Proposé' | 'Confirmé' | 'Report demandé' | 'Annulé' | 'Terminé';

export function ClientPortalAppointments() {
  const { isLoading, myAppointments, myDossiers, unreadNotificationsCount, updateAppointment } = useEspaceClientData();

  if (isLoading) {
    return <div className="p-4 sm:p-6 lg:p-8 text-sm text-slate-500">Chargement des rendez-vous...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PortalPageHeader
        title="Mes rendez-vous"
        subtitle="Gérez vos signatures d'actes et séances d'audition à l'étude."
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="space-y-4">
          {myAppointments.map((ap) => {
            const rel = myDossiers.find((d) => d.id === ap.dossierId);
            return (
              <div key={ap.id} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={24} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h5 className="font-bold text-slate-950 text-sm">
                        {new Date(ap.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </h5>
                      <span className="text-slate-500 text-xs">• à {ap.time}</span>
                      <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded font-semibold uppercase">
                        Dossier : {rel?.number}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium">Objet : {ap.purpose}</p>
                    <p className="text-xs text-slate-500">Lieu : {ap.location}</p>
                  </div>
                </div>

                <AppointmentActions appointment={ap} onUpdate={updateAppointment} />
              </div>
            );
          })}

          {myAppointments.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm italic">Aucun rendez-vous planifié.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppointmentActions({
  appointment,
  onUpdate,
}: {
  appointment: { id: string; status: AppointmentStatus };
  onUpdate: (appointmentId: string, status: AppointmentStatus) => Promise<void>;
}) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleUpdate = async (status: AppointmentStatus) => {
    setUpdatingStatus(status);
    try {
      await onUpdate(appointment.id, status);
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (appointment.status === 'Proposé' || appointment.status === 'planifie') {
    const isUpdating = updatingStatus !== null;
    return (
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <button
          onClick={() => handleUpdate('Confirmé')}
          disabled={isUpdating}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {updatingStatus === 'Confirmé' ? 'Validation...' : "Valider le rendez-vous"}
        </button>
        <button
          onClick={() => handleUpdate('Report demandé')}
          disabled={isUpdating}
          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {updatingStatus === 'Report demandé' ? 'Envoi...' : 'Reporter'}
        </button>
      </div>
    );
  }

  return <StatusBadge status={appointment.status} />;
}

export default ClientPortalAppointments;