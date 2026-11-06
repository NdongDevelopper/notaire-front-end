import { Clock, User } from "lucide-react";
import { formatDateTime } from "../../helpers/format";
import type { JournalEntry } from "../../types/journal.types";

interface JournalItemProps {
  entry: JournalEntry;
}

export const JournalItem = ({ entry }: JournalItemProps) => {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
      <div className="flex-shrink-0 mt-1">
        <Clock className="w-4 h-4 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">{entry.action}</p>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {formatDateTime(entry.created_at)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <span className="text-xs text-slate-500">
            <User className="w-3 h-3 inline mr-1" />
            {entry.utilisateur}
          </span>
          {entry.details && <span className="text-xs text-slate-400">{entry.details}</span>}
        </div>
      </div>
    </div>
  );
};