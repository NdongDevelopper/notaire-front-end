import { caseService } from '../../cases/services/case.service';
import type { Dossier } from '../../cases/types/case';
import { listerLignesFinancieres } from '../../finance/services/financeApi';
import { parseMontant } from '../../finance/types/finance';
import type { DashboardData, RecentCase } from '../types/dashboard';
import { mockDashboardData } from './dashboard.mock';
import { loadDashboardOffline, saveDashboardOffline } from './dashboardOfflineCache';
import { networkStatusManager } from '../../../shared/utils/offline/networkStatus';

const CLOSED_CASE_STATUSES = new Set([
  'archive',
  'archived',
  'cloture',
  'closed',
  'termine',
  'terminé',
  'terminee',
  'terminée',
]);

const normalizeStatus = (status?: string | null): string => {
  return String(status ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
};

const isActiveCase = (status?: string | null): boolean => {
  const normalized = normalizeStatus(status);

  if (!normalized) {
    return true;
  }

  if (CLOSED_CASE_STATUSES.has(normalized)) {
    return false;
  }

  return !normalized.includes('archive') && !normalized.includes('cloture') && !normalized.includes('termine');
};

const mapDossierToRecentCase = (dossier: Dossier): RecentCase => {
  const status = normalizeStatus(dossier.statut);
  let dashboardStatus: RecentCase['status'] = 'Actif';

  if (status.includes('retard') || status.includes('late')) {
    dashboardStatus = 'En retard';
  } else if (status.includes('piece') || status.includes('piece')) {
    dashboardStatus = 'Pièces en cours';
  }

  const createdAt = dossier.created_at || dossier.date_cible || new Date().toISOString();

  return {
    id: dossier.numero || dossier.id,
    type: typeof dossier.type_acte === 'object' && dossier.type_acte !== null && 'libelle' in dossier.type_acte
      ? dossier.type_acte.libelle
      : dossier.objet || 'Dossier',
    createdAt,
    status: dashboardStatus,
  };
};

export async function getDashboardData(): Promise<DashboardData> {
  const [dossiersResult, tasksResult, financeResult] = await Promise.allSettled([
    caseService.getDossiers(),
    caseService.getMesTaches(),
    listerLignesFinancieres(),
  ]);

  const anySucceeded = [dossiersResult, tasksResult, financeResult].some(
    (result) => result.status === 'fulfilled',
  );

  // Le dashboard du personnel ne doit pas devenir vide en mode hors ligne.
  // Contrairement au portail client, il n'avait pas encore de snapshot métier
  // dédié. On le restaure immédiatement si aucune source serveur n'est disponible.
  if (!anySucceeded && !networkStatusManager.getStatus()) {
    const cached = loadDashboardOffline();
    if (cached) return cached.data;
  }

  const dossiers = dossiersResult.status === 'fulfilled' ? dossiersResult.value : [];
  const tasks = tasksResult.status === 'fulfilled' ? tasksResult.value : [];
  const financeLines = financeResult.status === 'fulfilled' ? financeResult.value : [];

  const recentCases = [...dossiers]
    .sort((left, right) => {
      const leftDate = new Date(left.created_at || left.date_cible || 0).getTime();
      const rightDate = new Date(right.created_at || right.date_cible || 0).getTime();
      return rightDate - leftDate;
    })
    .slice(0, 3)
    .map(mapDossierToRecentCase);

  const revenue = financeLines.reduce((total, line) => {
    const normalizedCategory = normalizeStatus((line as { categorie?: string } | undefined)?.categorie);
    if (normalizedCategory === 'honoraires') {
      return total + parseMontant((line as { montant?: number | string } | undefined)?.montant);
    }

    return total;
  }, 0);

  const dashboardData: DashboardData = {
    ...mockDashboardData,
    recentCases,
    stats: {
      activeCases: dossiers.filter((dossier) => isActiveCase(dossier.statut)).length,
      pendingTasks: tasks.length,
      missingDocuments: mockDashboardData.stats.missingDocuments,
      revenue,
    },
  };

  // Toute réponse serveur, même partielle, constitue une nouvelle base locale.
  // Ainsi le juriste peut rouvrir le dashboard après un refresh sans connexion.
  if (anySucceeded) {
    saveDashboardOffline(dashboardData);
  }

  return dashboardData;
}
