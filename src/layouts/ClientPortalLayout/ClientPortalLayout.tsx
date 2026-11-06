import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ClientPortalSidebar } from './ClientPortalSidebar';
import ClientPortalMobileTopBar from './ClientPortalMobileTopBar';
import { EspaceClientDataProvider, useEspaceClientData } from '../../features/espace-client/context/EspaceClientDataContext';
import { OfflineSyncBanner } from '../../shared/components/OfflineSyncBanner';
import { HelpCentreModal } from '../../features/espace-client/components/HelpCentreModal';
import { useInactivityWatcher, InactivityDisconnectModal } from '../../features/auth/components/SessionExpiryWatcher';
import { PATHS } from '../../routes/Paths';

/**
 * Petit composant interne : lit `lastSyncAt` depuis le contexte des données
 * portail (le provider est au-dessus de la bannière, voir plus bas) et la
 * transmet à la bannière hors ligne. Isolation nécessaire car la bannière
 * doit être DANS le provider et DANS <main>.
 */
function PortalSyncBanner() {
  const { lastSyncAt } = useEspaceClientData();
  return <OfflineSyncBanner lastSyncAt={lastSyncAt} />;
}

export default function ClientPortalLayout() {
  const navigate = useNavigate();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  // Initialize inactivity watcher for automatic disconnect after 30 minutes
  const { showDisconnectModal, handleReconnect } = useInactivityWatcher();

  return (
    <EspaceClientDataProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        {/* Sidebar reste cachée jusqu'au breakpoint 'lg', comme DashboardLayout */}
        <ClientPortalSidebar
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          onOpenHelp={() => setIsHelpOpen(true)}
        />

        <div className="flex flex-col flex-1">
          <ClientPortalMobileTopBar onOpenSidebar={openSidebar} />

          <main className="flex-1 overflow-y-auto">
            <PortalSyncBanner />
            <Outlet />
          </main>
        </div>
      </div>

      <HelpCentreModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onContactStudy={() => navigate(PATHS.espaceClientMessages)}
      />

      {/* Inactivity disconnect modal */}
      <InactivityDisconnectModal 
        open={showDisconnectModal} 
        onReconnect={handleReconnect} 
      />
    </EspaceClientDataProvider>
  );
}
