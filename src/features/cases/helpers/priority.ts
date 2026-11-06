export const PRIORITY_LABELS: Record<string, string> = {
  basse: "Basse",
  normale: "Moyenne",
  haute: "Haute",
};

export const getPriorityColor = (priorite: string): string => {
  switch (priorite) {
    case 'haute':
      return 'bg-rose-50 text-rose-600 border-rose-100';
    case 'normale':
      return 'bg-amber-50 text-amber-600 border-amber-100';
    default:
      return 'bg-blue-50 text-blue-600 border-blue-100';
  }
};