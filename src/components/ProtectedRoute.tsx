import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ScaleIcon } from './icons/ScaleIcon';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-green"></div>
      </div>
    );
  }

  if (!hasRole(allowedRoles)) {
    return (
      <div className="text-center py-12 bg-yellow-50 rounded-lg shadow-sm">
        <ScaleIcon className="mx-auto h-12 w-12 text-yellow-500" />
        <h4 className="mt-4 text-lg font-medium text-yellow-800">Access Denied</h4>
        <p className="text-yellow-700 mt-2">
          You do not have the necessary permissions to view this page.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Please contact an administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};