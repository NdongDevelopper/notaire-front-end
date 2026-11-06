import type { DashboardData } from '../types/dashboard';

export const mockDashboardData: DashboardData = {
  stats: {
    activeCases: 1,
    pendingTasks: 0,
    missingDocuments: 12,
    revenue: 14500000, // 14.5 Millions
  },
  recentCases: [
    {
      id: 'NOT-2024-001',
      type: 'Vente',
      createdAt: '2026-07-03T08:00:00Z',
      status: 'Pièces en cours',
    },
    // On peut en ajouter un deuxième pour tester l'affichage d'une liste
    {
      id: 'NOT-2024-002',
      type: 'Succession',
      createdAt: '2026-07-01T14:30:00Z',
      status: 'Actif',
    },
  ],
  recentActivities: [], // Vide pour l'instant, comme sur ta maquette
};
