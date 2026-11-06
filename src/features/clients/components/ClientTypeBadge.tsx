import type { ClientType } from '../types/client.types';

interface ClientTypeBadgeProps {
  type: ClientType;
}

const styles: Record<ClientType, string> = {
  physique: 'bg-blue-50 text-blue-700',
  morale: 'bg-violet-50 text-violet-700',
};

const labels: Record<ClientType, string> = {
  physique: 'Particulier',
  morale: 'Société',
};

export function ClientTypeBadge({ type }: ClientTypeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[type]}`}
    >
      {labels[type]}
    </span>
  );
}
