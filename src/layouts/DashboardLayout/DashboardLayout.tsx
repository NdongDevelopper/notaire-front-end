import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileTopBar from './MobileTopBar';
import { useInactivityWatcher, InactivityDisconnectModal } from '../../features/auth/components/SessionExpiryWatcher';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  // Initialize inactivity watcher for automatic disconnect after 30 minutes
  const { showDisconnectModal, handleReconnect } = useInactivityWatcher();

  return (
    <div className="flex h-screen bg-bg-dashboard overflow-hidden">
      {/* La Sidebar reste cachée jusqu'au breakpoint 'lg' (tablettes incluses) */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="flex flex-col flex-1">
        <MobileTopBar onOpenSidebar={openSidebar} />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Inactivity disconnect modal */}
      <InactivityDisconnectModal 
        open={showDisconnectModal} 
        onReconnect={handleReconnect} 
      />
    </div>
  );
};

export default DashboardLayout;