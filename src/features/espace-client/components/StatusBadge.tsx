import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  FolderOpen,
  Send,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string | undefined;
}

/** Icône + classe de couleur pour un statut donné. */
interface StatusRule {
  pattern: RegExp;
  classes: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

/**
 * Règles ÉVALUÉES DANS L'ORDRE : la première règle dont le pattern matche
 * le libellé gagne. Le matching par sous-chaîne tolère les écarts de
 * formulation du backend ; l'ordre garantit que les cas spécifiques
 * (« envoyer » dans « En attente d'envoi ») ne sont pas éclipsés par les
 * cas génériques (« attente » / « envoi »).
 *
 * Feedback client #3 : chaque statut porte une icône + une couleur pour
 * être compris sans lire le texte, y compris au premier coup d'œil.
 */
const STATUS_RULES: StatusRule[] = [
  // Prioritaire : « en attente d'envoi » (action hors ligne) doit rester orange,
  // pas être capturé par la règle générique « envoi » (bleue) ci-dessous.
  { pattern: /attente d['’]envoi/i, classes: 'bg-orange-50 text-orange-700 border-orange-200', icon: Clock },
  { pattern: /envoy|transmis|déposé|recu|reçu/i, classes: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
  { pattern: /rejet|bloqu|annul|expir|refus|invalide/i, classes: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertCircle },
  { pattern: /valid|finalis|acquitt|confirm|termin|clôtur|clotur|payé|paye/i, classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  { pattern: /signature|signé|scell|paraph/i, classes: 'bg-violet-50 text-violet-700 border-violet-200', icon: FileCheck },
  { pattern: /propos|planifi|report/i, classes: 'bg-sky-50 text-sky-700 border-sky-200', icon: Calendar },
  { pattern: /cours|vérif|verif|rédaction|traitement/i, classes: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Clock },
  { pattern: /attente|fournir|manquant/i, classes: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  { pattern: /ouvert/i, classes: 'bg-blue-50 text-blue-700 border-blue-200', icon: FolderOpen },
];

const DEFAULT_RULE: StatusRule = {
  pattern: /./,
  classes: 'bg-blue-50 text-blue-700 border-blue-200',
  icon: FileText,
};

/**
 * Renders a colored pill with an icon for a dossier/piece/client-facing
 * status string. Matching is done on substring so it tolerates minor
 * backend wording drift (e.g. "En attente de pièces" vs "En attente").
 * Once real endpoints are documented, confirm the exact set of status
 * values with backend and consider switching this to an exhaustive
 * enum-based map.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const label = status || 'En cours';
  const rule = STATUS_RULES.find((r) => r.pattern.test(label)) ?? DEFAULT_RULE;
  const Icon = rule.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${rule.classes}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

export default StatusBadge;