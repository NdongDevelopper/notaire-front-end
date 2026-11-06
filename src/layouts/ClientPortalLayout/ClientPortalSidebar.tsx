import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Folder,
  FileWarning,
  FileText,
  MessageSquare,
  CalendarDays,
  CreditCard,
  User,
  HelpCircle,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { PATHS } from '../../routes/Paths';
import { useEspaceClientData } from '../../features/espace-client/context/EspaceClientDataContext';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

function initials(firstName?: string, lastName?: string, fallback = 'Client'): string {
  const parts = [firstName, lastName].filter(Boolean) as string[];
  if (parts.length === 0) return fallback.slice(0, 2).toUpperCase();
  return parts.map((part) => part[0]?.toUpperCase()).join('');
}

// AuthUser.role only tells you it's a client account, not the qualité
// (e.g. "Vendeur" / "Acheteur") shown in the mockup — that's per-dossier,
// not a user-level field. Wire this up once the client-portal endpoints
// expose it; for now it falls back to a generic "Client" label.
function roleLabel(): string {
  return 'Client';
}

interface ClientPortalSidebarProps {
  onOpenHelp: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientPortalSidebar({ onOpenHelp, isOpen, onClose }: ClientPortalSidebarProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { myDossiers, myPieces, myDocs, pendingPayment } = useEspaceClientData();

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : 'Client';

  const piecesToProvideCount = myPieces.filter(
    (p) => p.clientStatus === 'À fournir' || p.clientStatus === 'Rejetée',
  ).length;

  const navItems: NavItem[] = [
    { label: 'Tableau de bord', to: PATHS.espaceClient, icon: LayoutGrid },
    { label: 'Mes dossiers', to: PATHS.espaceClientDossiers, icon: Folder, badge: myDossiers.length },
    { label: 'Pièces à fournir', to: PATHS.espaceClientPieces, icon: FileWarning, badge: piecesToProvideCount },
    { label: 'Mes documents', to: PATHS.espaceClientDocuments, icon: FileText, badge: myDocs.length },
    { label: 'Messages', to: PATHS.espaceClientMessages, icon: MessageSquare },
    { label: 'Rendez-vous', to: PATHS.espaceClientRendezVous, icon: CalendarDays },
    { label: 'Paiements', to: PATHS.espaceClientPaiements, icon: CreditCard, badge: pendingPayment ? 1 : 0 },
    { label: 'Mon profil', to: PATHS.espaceClientProfil, icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate(PATHS.login, { replace: true });
  };

  // Closes the mobile drawer after any in-portal navigation, so tapping
  // a nav item doesn't leave the drawer open over the new page.
  const handleNavClick = () => onClose();

  return (
    <>
      {/* Backdrop — mobile/tablet only, shown while the drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-shrink-0 flex-col bg-[#0B1220] text-slate-200 transition-transform duration-300 ease-in-out
          lg:static lg:z-auto lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-white">Portail Client</p>
              <p className="text-[11px] font-medium tracking-wide text-amber-400">NOTARIA CRM</p>
            </div>
          </div>

          {/* Close button — mobile/tablet only */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-[#0B1220]">
            {initials(user?.firstName, user?.lastName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <span className="inline-block rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300">
              {roleLabel()}
            </span>
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 px-3">
          {navItems.map(({ label, to, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === PATHS.espaceClient}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-[#0B1220]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </span>
              {typeof badge === 'number' && badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0B1220]/20 px-1 text-[11px] font-bold">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}

          {/* Centre d'aide opens a modal (HelpCentreModal) rather than
              navigating to a route — see ClientPortalLayout. */}
          <button
            type="button"
            onClick={() => {
              onOpenHelp();
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <HelpCircle className="h-[18px] w-[18px]" />
            Centre d'aide
          </button>
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Me déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}

export default ClientPortalSidebar;
