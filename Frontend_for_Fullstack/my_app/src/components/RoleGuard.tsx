// src/components/RoleGuard.tsx
import React from 'react';
import { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

interface RoleGuardProps {
  requiredRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  requiredRoles, 
  children, 
  fallback = null 
}) => {
  const { hasRole } = useAuth();

  return hasRole(requiredRoles) ? <>{children}</> : <>{fallback}</>;
};
