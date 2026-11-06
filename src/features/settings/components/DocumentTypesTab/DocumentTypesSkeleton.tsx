import React from 'react';
import { Skeleton } from '../../../../shared/components/ui/Skeleton/Skeleton';

const CARDS = 3;

/** Squelette de la grille des types d'actes (cartes). */
export const DocumentTypesSkeleton: React.FC = () => {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: CARDS }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-full flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-6 rounded-md" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-40 mb-6" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
};
