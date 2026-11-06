// components/CategoryFilter.tsx
import { CATEGORIE_TOUS } from "../types/models";
import type { TypeActe } from "../types/models";

interface CategoryFilterProps {
  categories: TypeActe[];
  selected: string;
  onSelect: (code: string) => void;
  loading?: boolean;
}

/**
 * Filtre de catégories (types d'actes) de la Bibliothèque de Modèles.
 * "Tous" + un item par type d'acte actif renvoyé par /api/types-actes/.
 */
export default function CategoryFilter({
  categories,
  selected,
  onSelect,
  loading = false,
}: CategoryFilterProps) {
  return (
    <div className="sticky top-30 self-start max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
      Catégories
    </h3>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="h-8 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : (
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => onSelect(CATEGORIE_TOUS)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${selected === CATEGORIE_TOUS
                  ? "bg-blue-50 font-semibold text-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              Tous
            </button>
          </li>
          {categories
            .filter((cat) => cat.actif)
            .map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => onSelect(cat.code)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${selected === cat.code
                      ? "bg-blue-50 font-semibold text-blue-600"
                      : "text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  {cat.libelle}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
