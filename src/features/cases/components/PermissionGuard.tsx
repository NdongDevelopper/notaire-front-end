// import { ReactNode } from 'react';
// import { usePermissions } from '../hooks/usePermissions';
// import type { PermissionAction, PermissionResource } from '../types/permissions.types';

// interface PermissionGuardProps {
//   resource: PermissionResource;
//   action: PermissionAction;
//   children: ReactNode;
//   fallback?: ReactNode;
//   userId?: string;
// }

// export const PermissionGuard = ({
//   resource,
//   action,
//   children,
//   fallback = null,
//   userId,
// }: PermissionGuardProps) => {
//   const { hasPermission, loading } = usePermissions(userId);

//   if (loading) {
//     return null;
//   }

//   if (!hasPermission(resource, action)) {
//     return <>{fallback}</>;
//   }

//   return <>{children}</>;
// };