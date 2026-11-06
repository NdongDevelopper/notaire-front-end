import { JournalItem } from "./JournalItem";
import type { JournalEntry } from "../../types/journal.types";

interface JournalTabProps {
  entries: JournalEntry[];
}

export const JournalTab = ({ entries }: JournalTabProps) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
      <h3 className="text-base font-bold text-slate-900 mb-5">Journal d'activité</h3>

      {entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry) => (
            <JournalItem key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic text-center py-8">Aucune activité enregistrée pour ce dossier.</p>
      )}
    </div>
  );
};