// On utilise des "Union Types" pour les statuts.
// Cela évite les fautes de frappe et permet de lier facilement des couleurs plus tard.
export type CaseStatus = 'Actif' | 'Pièces en cours' | 'En retard' | 'À récupérer';

export interface DashboardStats {
  activeCases: number;
  pendingTasks: number;
  missingDocuments: number;
  // Bonne pratique : l'API renvoie toujours un nombre brut (ex: 14500000).
  // C'est le frontend qui s'occupera d'afficher "14.5M CFA".
  revenue: number;
}

export interface RecentCase {
  id: string; // ex: "NOT-2024-001"
  type: string; // ex: "Vente"
  createdAt: string; // Date au format ISO (ex: "2026-07-03T10:00:00Z")
  status: CaseStatus;
}

export interface ActivityLog {
  id: string;
  action: string;
  date: string;
}

// L'interface globale que notre futur faux "backend" va nous renvoyer
export interface DashboardData {
  stats: DashboardStats;
  recentCases: RecentCase[];
  recentActivities: ActivityLog[];
}
