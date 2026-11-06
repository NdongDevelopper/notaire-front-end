import type { HTMLAttributes } from 'react';

export interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

export const Loader = ({ size = 'md', label, className = '', ...props }: LoaderProps) => {
  return (
    <div role="status" className={`inline-flex flex-col items-center justify-center gap-2 ${className}`} {...props}>
      <div className={`${sizeMap[size]} animate-spin rounded-full border-[var(--color-primary)] border-t-transparent`} />
      {label && <span className="text-sm text-(--color-secondary-text)">{label}</span>}
      <span className="sr-only">Chargement...</span>
    </div>
  );
};

export default Loader;
