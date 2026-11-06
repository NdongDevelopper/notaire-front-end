import type { DashboardData } from '../types/dashboard';

const STORAGE_KEY = 'staff:dashboard-data:v1';
const SYNC_KEY = 'staff:dashboard-sync:v1';

interface StoredDashboard {
  ownerId: string | null;
  data: DashboardData;
  syncedAt: string;
}

function getOwnerId(): string | null {
  try {
    const raw = localStorage.getItem('auth:offline-user:v1');
    if (!raw) return null;
    const user = JSON.parse(raw) as { id?: string | number };
    return user?.id != null ? String(user.id) : null;
  } catch {
    return null;
  }
}

export function saveDashboardOffline(data: DashboardData): string {
  const syncedAt = new Date().toISOString();
  try {
    const payload: StoredDashboard = {
      ownerId: getOwnerId(),
      data,
      syncedAt,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    localStorage.setItem(SYNC_KEY, syncedAt);
  } catch {
    // Le cache local est un filet de sécurité : ne jamais bloquer le dashboard.
  }
  return syncedAt;
}

export function loadDashboardOffline(): { data: DashboardData; syncedAt: string | null } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredDashboard;
    if (!stored?.data || stored.ownerId !== getOwnerId()) return null;

    return {
      data: stored.data,
      syncedAt: stored.syncedAt ?? localStorage.getItem(SYNC_KEY),
    };
  } catch {
    return null;
  }
}

export function clearDashboardOffline(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SYNC_KEY);
  } catch {
    // Rien à faire.
  }
}
