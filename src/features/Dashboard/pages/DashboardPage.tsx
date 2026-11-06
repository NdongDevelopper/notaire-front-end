import React, { useEffect, useState } from 'react';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { RecentCases } from '../components/RecentCases';
import { ActivityLogPanel } from '../components/ActivityLogPanel';
import { mockDashboardData } from '../api/dashboard.mock';
import { getDashboardData } from '../api/dashboard.api';
import { loadDashboardOffline } from '../api/dashboardOfflineCache';
import { useAuthStore } from '../../../features/auth/store/auth.store';
import { Loader } from '../../../shared/components/ui/Loader/Loader';
import type { DashboardData } from '../types/dashboard';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Affichage instantané du dernier état connu pour le personnel.
    // Le rafraîchissement API continue ensuite si le réseau est disponible.
    const cached = loadDashboardOffline();
    if (cached && isMounted) {
      setDashboardData(cached.data);
      setIsLoading(false);
    }

    const loadDashboardData = async () => {
      try {
        const data = await getDashboardData();
        if (isMounted) {
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du tableau de bord :', error);
        if (isMounted) {
          setDashboardData(mockDashboardData);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const { stats, recentCases, recentActivities } = dashboardData || {};

  return (
    <div className="space-y-8 p-6 max-w-(--breakpoint-2xl) mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-text tracking-tight sm:text-3xl">
          {user?.firstName && user?.lastName 
            ? `Bienvenue, ${user.firstName} ${user.lastName}` 
            : 'Bienvenue'}
        </h1>
        <p className="text-sm text-text-muted">Voici un aperçu de l'activité de l'étude aujourd'hui.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" label="Chargement des données du tableau de bord..." />
        </div>
      ) : (
        <>
          {stats && <DashboardStatsGrid stats={stats} />}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 h-full">
              {recentCases && <RecentCases cases={recentCases} />}
            </div>

            <div className="lg:col-span-1 h-full">
              {recentActivities && <ActivityLogPanel activities={recentActivities} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
