import React from 'react';
import { Skeleton } from '../../../../shared/components/ui/Skeleton/Skeleton';

const ROWS = 7;
const ACTIONS = 6;

/** Squelette du tableau des permissions (modules × actions). */
export const PermissionsMatrixSkeleton: React.FC = () => {
  return (
    <div className="flex-1 bg-white p-6 rounded-xl border border-slate-100 shadow-sm w-full">
      <Skeleton className="h-5 w-56 mb-2" />
      <Skeleton className="h-4 w-80 mb-6" />

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-150 text-left">
          <thead>
            <tr>
              <th className="py-4">
                <Skeleton className="h-3 w-16" />
              </th>
              {Array.from({ length: ACTIONS }).map((_, i) => (
                <th key={i} className="py-4 px-2">
                  <Skeleton className="h-3 w-12 mx-auto" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: ROWS }).map((_, row) => (
              <tr key={row}>
                <td className="py-4">
                  <Skeleton className="h-4 w-24" />
                </td>
                {Array.from({ length: ACTIONS }).map((_, col) => (
                  <td key={col} className="py-4 px-2">
                    <Skeleton className="h-4 w-4 mx-auto rounded" />
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
