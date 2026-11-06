import { LayoutDashboard, Users, FolderKanban, KanbanSquare, CheckSquare, Wallet, FileText, Settings } from 'lucide-react';

export const navigation = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Clients',
    path: '/dashboard/clients',
    icon: Users,
  },
  {
    label: 'Dossiers',
    path: '/dashboard/dossiers',
    icon: FolderKanban,
  },
  {
    label: 'Kanban',
    path: '/dashboard/kanban',
    icon: KanbanSquare,
  },
  {
    label: 'Tâches',
    path: '/dashboard/taches',
    icon: CheckSquare,
  },
  {
    label: 'Finances',
    path: '/dashboard/finances',
    icon: Wallet,
  },
  {
    label: "Modèles D'actes",
    path: '/dashboard/modele',
    icon: FileText,
  },
  {
    label: 'Paramètres',
    path: '/dashboard/settings',
    icon: Settings,
  },
];
