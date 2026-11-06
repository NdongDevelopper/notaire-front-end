interface GeneralInformationProps {
  responsible: string;
  createdAt: string;
  type: string;
}

export const GeneralInformation = ({
  responsible,
  createdAt,
  type,
}: GeneralInformationProps) => {
  return (
    <>
      <h3 className="text-base font-bold text-slate-900 mb-5">Détails Générales</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4 text-sm">
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-0.5">Responsable</span>
          <span className="font-semibold text-slate-800">{responsible || "Non assigné"}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-0.5">Date de création</span>
          <span className="font-semibold text-slate-800">{createdAt || "Non définie"}</span>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-0.5">Type d'acte</span>
          <span className="font-semibold text-slate-800">{type}</span>
        </div>
      </div>
    </>
  );
};