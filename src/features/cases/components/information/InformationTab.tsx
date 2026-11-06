import { GeneralInformation } from "./GeneralInformation";
import { PartiesCard } from "./PartiesCard";

interface InformationTabProps {
  responsible: string;
  createdAt: string;
  type: string;
  clients: Array<{ id: string; name: string; role: string }> | undefined;
  onAddClient: () => void;
}

export const InformationTab = ({
  responsible,
  createdAt,
  type,
  clients,
  onAddClient,
}: InformationTabProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
        <GeneralInformation
          responsible={responsible}
          createdAt={createdAt}
          type={type}
        />
      </div>

      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
        <PartiesCard clients={clients} onAddClient={onAddClient} />
      </div>
    </div>
  );
};