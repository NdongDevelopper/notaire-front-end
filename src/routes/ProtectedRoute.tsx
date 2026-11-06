import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/auth.store';
import { Loader } from '../shared/components/ui/Loader/Loader';
import { ForceChangePasswordModal } from '../features/auth/components/ForceChangePasswordModal';
import { getHomeRouteForRole, type UserRole } from './Paths';

interface ProtectedRouteProps {
  /**
   * If provided, only users whose role is in this list may pass through.
   * Authenticated users with a different role are redirected to their own
   * home route instead of being bounced to /login.
   */
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    if (status === 'idle') {
      restoreSession();
    }
  }, [restoreSession, status]);

  if (status === 'idle' || status === 'authenticating') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader />
      </div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Authenticated but on the wrong branch (e.g. a client hitting /dashboard,
  // or staff hitting /espace-client) — send them to their own home route.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRouteForRole(user.role)} replace />;
  }

  return (
    <>
      <Outlet />
      {user.changerLeMotDePasse && <ForceChangePasswordModal />}
    </>
  );
}

export default ProtectedRoute;