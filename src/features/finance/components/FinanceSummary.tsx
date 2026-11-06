// components/FinanceSummary.tsx
import { Briefcase, FileText, CreditCard, Clock } from "lucide-react";
import StatsCard from "./StatsCard";

interface FinanceSummaryProps {
  honorairesTotal: number;
  deboursTotal: number;
  totalEncaisse: number;
  resteARecouvrer: number;
  loading?: boolean;
}

/**
 * Bandeau des 4 indicateurs financiers de l'étude: honoraires totaux,
 * débours de l'étude, total encaissé, restant à recouvrer.
 * Reprend le style du "Module Comptabilité" (cahier des charges §6, §15).
 */
export default function FinanceSummary({
  honorairesTotal,
  deboursTotal,
  totalEncaisse,
  resteARecouvrer,
  loading = false,
}: FinanceSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        label="Honoraires Totaux"
        amount={honorairesTotal}
        tone="blue"
        icon={<Briefcase size={20} strokeWidth={2} />}
      />
      <StatsCard
        label="Débours Étude"
        amount={deboursTotal}
        tone="orange"
        icon={<FileText size={20} strokeWidth={2} />}
      />
      <StatsCard
        label="Total Encaissé"
        amount={totalEncaisse}
        tone="emerald"
        icon={<CreditCard size={20} strokeWidth={2} />}
      />
      <StatsCard
        label="Restant à Recouvrer"
        amount={resteARecouvrer}
        tone="rose"
        icon={<Clock size={20} strokeWidth={2} />}
      />
    </div>
  );
}
