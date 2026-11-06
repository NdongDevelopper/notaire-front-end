import { ShieldCheck } from 'lucide-react';

/**
 * Badge « Acte sécurisé et inaltérable » (feedback client #1).
 * Affiche la garantie d'intégrité cryptographique sur les actes signés :
 * dossier détail + liste « Mes documents partagés ».
 */
export function ActeSecuriseBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
      <ShieldCheck size={14} className="text-emerald-700" />
      Acte sécurisé et inaltérable
    </span>
  );
}

export default ActeSecuriseBadge;