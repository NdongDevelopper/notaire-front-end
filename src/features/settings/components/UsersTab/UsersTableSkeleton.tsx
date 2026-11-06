import React from 'react';
import { Skeleton } from '../../../../shared/components/ui/Skeleton/Skeleton';

const COLUMNS = 5;
const ROWS = 5;

/** Squelette de la table des comptes (5 colonnes, quelques lignes). */
export const UsersTableSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm w-full">
      <div className="p-6 flex items-center justify-between border-b border-slate-100 gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-187.5 text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              {Array.from({ length: COLUMNS }).map((_, i) => (
                <th key={i} className="py-4 px-6">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }).map((_, row) => (
              <tr key={row} className="border-t border-slate-100">
                {Array.from({ length: COLUMNS }).map((_, col) => (
                  <td key={col} className="py-4 px-6">
                    <Skeleton className={`h-4 ${col === 0 ? 'w-40' : 'w-24'}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
