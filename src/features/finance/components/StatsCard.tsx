// components/StatsCard.tsx
import type { ReactNode } from "react";

export type StatsCardTone = "blue" | "orange" | "emerald" | "rose";

interface StatsCardProps {
  label: string;
  amount: number;
  suffix?: string; // ex: "FCFA"
  tone?: StatsCardTone;
  icon: ReactNode;
}

const ICON_WRAPPER_CLASSES: Record<StatsCardTone, string> = {
  blue: "bg-blue-100 text-blue-600",
  orange: "bg-orange-100 text-orange-500",
  emerald: "bg-emerald-100 text-emerald-600",
  rose: "bg-rose-100 text-rose-500",
};

/**
 * Carte indicateur de style "tableau de bord comptabilité": icône carrée
 * colorée, montant en gros, libellé en dessous. Réutilisée par
 * FinanceSummary pour les 4 KPIs financiers de l'étude.
 */
export default function StatsCard({
  label,
  amount,
  suffix = "FCFA",
  tone = "blue",
  icon,
}: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${ICON_WRAPPER_CLASSES[tone]}`}>
          {icon}
        </span>
        <p className="text-2xl font-bold text-slate-900">
          {new Intl.NumberFormat("fr-FR").format(Math.round(amount))}{" "}
          <span className="text-sm font-semibold text-slate-400">{suffix}</span>
        </p>
      </div>
      <p className="mt-3 text-sm text-slate-500">{label}</p>
    </div>
  );
}
