import type { Client } from '../types/client.types';

export function getClientDisplayName(client: Client): string {
  return client.nom;
}

export function getClientInitials(client: Client): string {
  const parts = client.nom.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function getClientTypeLabel(client: Client): string {
  return client.type === 'physique' ? 'Particulier' : 'Société';
}

export function getNomFieldLabel(type: Client['type']): string {
  return type === 'physique' ? 'Nom complet' : 'Raison sociale';
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}
