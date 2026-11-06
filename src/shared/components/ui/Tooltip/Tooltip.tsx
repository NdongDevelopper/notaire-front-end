import type { ReactNode } from 'react';

interface TooltipProps {
  /** Texte d'aide contextuelle affiché au survol / focus. */
  label: string;
  children: ReactNode;
}

/**
 * Infobulle d'aide contextuelle (feedback client #3).
 * Alternative accessible aux seuls tooltips natifs : déclenchée au survol
 * (groupe) ET au focus clavier, positionnée au-dessus de son déclencheur.
 * Le contenu est porté par un attribut title sur le déclencheur pour les
 * lecteurs d'écran.
 */
export function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex items-center">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 mb-2 z-30 hidden group-hover:block group-focus-within:block whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg"
      >
        {label}
      </span>
    </span>
  );
}

export default Tooltip;