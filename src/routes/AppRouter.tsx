/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Layouts & Auth
import DashboardLayout from '../layouts/DashboardLayout/DashboardLayout';
import ClientPortalLayout from '../layouts/ClientPortalLayout/ClientPortalLayout';
import ProtectedRoute from './ProtectedRoute';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { useAuthStore } from '../features/auth/store/auth.store';
import OfflineIndicator from '../shared/components/OfflineIndicator';

// Pages — staff
import { DashboardPage } from '../features/Dashboard';
import { ClientsPage } from '../features/clients';
import { SettingsPage } from '../features/settings';
import { FinancePage } from '../features/finance';
import { ModelsLibraryPage } from '../features/models';
import { TasksPage } from '../features/tasks/pages/TachesPage';

// Pages — client portal
import { ClientPortalDashboard } from '../features/espace-client/pages/ClientPortalDashboard';
import { ClientPortalDossiers } from '../features/espace-client/pages/ClientPortalDossiers';
import { ClientPortalDossierDetail } from '../features/espace-client/pages/ClientPortalDossierDetail';
import { ClientPortalPieces } from '../features/espace-client/pages/ClientPortalPieces';
import { ClientPortalDocuments } from '../features/espace-client/pages/ClientPortalDocuments';
import { ClientPortalMessages } from '../features/espace-client/pages/ClientPortalMessages';
import { ClientPortalAppointments } from '../features/espace-client/pages/ClientPortalAppointments';
import { ClientPortalPayments } from '../features/espace-client/pages/ClientPortalPayments';
import { ClientPortalProfile } from '../features/espace-client/pages/ClientPortalProfile';

// Cases
import { CasesPage } from '../features/cases/pages/CasesPage';
import { CaseDetailsPage } from '../features/cases/pages/CaseDetailsPage';
import { CreateCasePage } from '../features/cases/pages/CreateCasePage';
import { KanbanBoard } from '../features/cases/components/KanbanBoard';

// Types
import type { Case, CaseStatus } from '../features/cases/types/case';
import { STAFF_ROLES, CLIENT_ROLES, getHomeRouteForRole } from './Paths';

const Placeholder = ({ title }: { title: string }) => <div className="p-6 text-slate-800">{title}</div>;

/**
 * Role-aware replacement for a hardcoded `<Navigate to="/dashboard" />`.
 * Used for both `/` and the catch-all `*` route so a client user never
 * gets bounced into the staff app (and vice versa).
 */
function RoleBasedRedirect() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getHomeRouteForRole(user.role)} replace />;
}

const AppRouter = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleAddCase = (_newCase: { title: string; type: Case['type']; responsible: string }) => {
    setIsCreateModalOpen(false);
  };

  const handleAddClientToCase = (_caseId: string, _clientName: string, _role: any) => {
    // Backend-driven app: case details are refreshed from the server, no local state is kept here.
  };

  const handleUpdateStatus = (_caseId: string, _newStatus: CaseStatus) => {
    // Status updates are handled by the backend and the Kanban board reloads data after change.
  };

  return (
    <>
      <OfflineIndicator />
      <Routes>
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* Routes protégées — équipe de l'étude */}
        <Route element={<ProtectedRoute allowedRoles={STAFF_ROLES} />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route
              path="dossiers"
              element={
                <CasesPage
                  onCreateClick={() => setIsCreateModalOpen(true)}
                  onOpenClick={(id) => navigate(`/dashboard/dossiers/${id}`)}
                />
              }
            />
            <Route
              path="dossiers/:id"
              element={
                <CaseDetailsPage
                  onAddClient={handleAddClientToCase}
                  onStatusChange={handleUpdateStatus}
                />
              }
            />
            <Route
              path="kanban"
              element={
                <div className="min-h-screen bg-bg-dashboard p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Workflow</h2>
                    <p className="text-sm font-medium text-slate-500">
                      Suivi visuel et glisser-déposer de l'avancement des dossiers.
                    </p>
                  </div>
                  <KanbanBoard onStatusChange={handleUpdateStatus} />
                </div>
              }
            />
            <Route path="taches" element={<TasksPage />} />
            <Route
              path="finances"
              element={
                <FinancePage
                  onOuvrirDossier={(id) => navigate(`/dashboard/dossiers/${id}`)}
                />
              }
            />
            <Route path="modele" element={<ModelsLibraryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Routes protégées — portail client */}
        <Route element={<ProtectedRoute allowedRoles={CLIENT_ROLES} />}>
          <Route path="/espace-client" element={<ClientPortalLayout />}>
            <Route index element={<ClientPortalDashboard />} />
            <Route path="dossiers" element={<ClientPortalDossiers />} />
            <Route path="dossiers/:id" element={<ClientPortalDossierDetail />} />
            <Route path="pieces" element={<ClientPortalPieces />} />
            <Route path="documents" element={<ClientPortalDocuments />} />
            <Route path="messages" element={<ClientPortalMessages />} />
            <Route path="rendez-vous" element={<ClientPortalAppointments />} />
            <Route path="paiements" element={<ClientPortalPayments />} />
            <Route path="profil" element={<ClientPortalProfile />} />
            {/* No "aide" route — Centre d'aide is now HelpCentreModal,
                triggered from ClientPortalSidebar, not a page. */}
          </Route>
        </Route>

        {/* Routes publiques */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Placeholder title="Register Page (coming soon)" />} />

        {/* Fallback global */}
        <Route path="*" element={<RoleBasedRedirect />} />
      </Routes>

      {/* Modale de création */}
      {isCreateModalOpen && (
        <CreateCasePage
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleAddCase}
        />
      )}
    </>
  );
};

export default AppRouter;
