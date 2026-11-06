import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { navigation } from './navigation.config';
import { X } from 'lucide-react';
import { LogOut, Scale } from 'lucide-react';
import { ConfirmationModal } from '../../shared/components/ui/Modal/ConfirmationModal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const Sidebar = ({ isOpen, onClose }: Props) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Utilisateur';
  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : 'U';

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 lg:hidden" onClick={onClose} />}

      <aside
        className={`
          fixed lg:static top-0 left-0 h-full w-64
          bg-bg-sidebar text-text-sidebar
          transform transition-transform duration-300 ease-in-out
          z-50 flex flex-col justify-between shadow-2xl lg:shadow-none

          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div>
          <div className="p-2 border-b border-white/10">
            <div className="flex items-center gap-3 p-2 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                <Scale size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-md leading-tight truncate">Étude Notaire</span>
                <span className="text-xs text-blue-400 font-medium">Sénégal</span>
              </div>
            </div>

            {/* Bouton de fermeture visible sur tablette et mobile */}
            <button onClick={onClose} className="lg:hidden p-2 text-text-sidebar-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors" aria-label="Fermer le menu">
              <X size={20} />
            </button>
          </div>

          {/* Liens de navigation */}
          <nav className="mt-5 mx-2 flex flex-col gap-1.5">
            {navigation
              .filter((item) => {
                if (item.path === '/dashboard/settings') return user?.role === 'associe';
                if (item.path === '/dashboard/finances') return user?.role === 'associe' || user?.role === 'comptable';
                return true;
              })
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  end
                  className={({ isActive }) => `
                  px-4 py-2.5 mx-2 flex gap-3 items-center rounded-xl font-medium text-[15px]
                  transition-all duration-200 ease-in-out
                  transform hover:translate-x-1 active:scale-98
                  hover:bg-white/5
                  ${isActive ? 'bg-activeBtn text-white shadow-md shadow-black/10 font-semibold' : 'text-text-sidebar-muted'}
                `}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
          </nav>
        </div>

        {/* Pied de la Sidebar */}
        <div className="p-4 border-t border-white/10 flex flex-col gap-4 mb-2">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0">{initials}</div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-white text-sm truncate">{fullName}</span>
              <span className="text-xs text-text-sidebar-muted truncate">{user?.role ?? 'Utilisateur'}</span>
            </div>
          </div>

          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-3 px-2 py-2 text-text-sidebar-muted hover:text-white w-full text-left transition-all duration-200 ease-in-out transform hover:translate-x-1 active:scale-98 rounded-lg hover:bg-white/5"
          >
            <LogOut size={18} className="shrink-0 text-red-400/80" />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          onClose();
          void logout();
        }}
        title="Déconnexion"
        description="Êtes-vous sûr de vouloir vous déconnecter ? Votre session sera fermée."
        variant="danger"
        confirmLabel="Se déconnecter"
      />
    </>
  );
};

export default Sidebar;
