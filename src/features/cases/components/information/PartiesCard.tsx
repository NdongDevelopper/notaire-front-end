import { Button } from "../../../../shared/components/ui/Button/Button";

interface PartiesCardProps {
  clients: Array<{ id: string; name: string; role: string }> | undefined;
  onAddClient: () => void;
}

export const PartiesCard = ({ clients, onAddClient }: PartiesCardProps) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-slate-900">Parties au dossier</h3>
        <Button variant="secondary" onClick={onAddClient} className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 p-0 font-bold">
          +
        </Button>
      </div>
      <div className="space-y-2">
        {clients && clients.length > 0 ? (
          clients.map((client) => (
            <div key={client.id} className="flex flex-wrap justify-between items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-semibold text-slate-800">{client.name}</span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 uppercase border border-blue-100">{client.role}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400 italic py-4 text-center">Aucune partie liée.</p>
        )}
      </div>
    </>
  );
};