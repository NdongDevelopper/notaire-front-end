import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckSquare, FileWarning, CreditCard } from 'lucide-react';
import { StatCard } from './StatCard';
import { formatRevenue } from '../utils/formatters';
import type { DashboardStats } from '../types/dashboard';
import { PATHS } from '../../../routes/Paths';

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ stats }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Dossiers en cours" 
        value={stats.activeCases} 
        subText="Actifs" 
        icon={Briefcase} 
        variant="primary" 
        onClick={() => navigate(PATHS.dashboardDossiers)}
      />

      <StatCard 
        title="Mes tâches" 
        value={stats.pendingTasks} 
        subText={`${stats.pendingTasks} en retard`} 
        icon={CheckSquare} 
        variant="success"
        onClick={() => navigate(PATHS.dashboardTaches)}
      />

      <StatCard 
        title="Documents manquants" 
        value={stats.missingDocuments} 
        subText="À récupérer" 
        icon={FileWarning} 
        variant="warning"
        onClick={() => navigate(PATHS.dashboardDossiers)}
      />

      <StatCard 
        title="Chiffre d'Affaires" 
        value={formatRevenue(stats.revenue)} 
        subText="CFA (Prév.)" 
        icon={CreditCard} 
        variant="primary"
        onClick={() => navigate(PATHS.dashboardFinances)}
      />
    </div>
  );
};
