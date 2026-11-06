import type { HTMLAttributes } from 'react';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/**
 * Bloc de chargement animé (placeholder gris qui pulse).
 * On compose plusieurs Skeleton pour reproduire la forme du contenu à venir.
 */
export const Skeleton = ({ className = '', ...props }: SkeletonProps) => {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-slate-200 ${className}`} {...props} />;
};

export default Skeleton;
