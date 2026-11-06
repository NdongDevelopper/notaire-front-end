import { AlertCircle } from "lucide-react";
import type { DossierTask } from "../../types/case";

interface TaskBadgesProps {
  task: DossierTask;
  isOverdue: boolean;
}

export const TaskBadges = ({ task, isOverdue }: TaskBadgesProps) => {
  return (
    <>
      {task.priorite === 'haute' && (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-600 uppercase">Urgent</span>
      )}
      {isOverdue && task.statut !== 'termine' && task.statut !== 'annule' && (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600 uppercase flex items-center gap-0.5">
          <AlertCircle className="w-3 h-3" /> Retard
        </span>
      )}
    </>
  );
};