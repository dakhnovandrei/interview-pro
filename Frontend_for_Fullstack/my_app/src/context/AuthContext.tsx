// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { UserRole } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  userRole: UserRole | null;
  username: string | null;
  email: string | null;
  login: (accessToken: string, refreshToken: string, userId?: string, role?: UserRole, username?: string, email?: string) => void;
  logout: () => Promise<void>;
  hasRole: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      checkToken(token);
    }
  }, []);

  const checkToken = (token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      setUserId(decoded.id || decoded.user_id || null);
      setUserRole(decoded.role || null);
      setUsername(decoded.username || localStorage.getItem('username') || null);
      setEmail(decoded.email || localStorage.getItem('email') || null);
      setIsAuthenticated(true);
    } catch (e) {
      logout();
    }
  };

  const login = (
    accessToken: string,
    refreshToken: string,
    userId?: string,
    role?: UserRole,
    username?: string,
    email?: string
  ) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    if (userId) localStorage.setItem('userId', userId);
    if (username) localStorage.setItem('username', username);
    if (email) localStorage.setItem('email', email);
    setUserId(userId || null);
    setUserRole(role || null);
    setUsername(username || null);
    setEmail(email || null);
    checkToken(accessToken);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      setIsAuthenticated(false);
      setUserId(null);
      setUserRole(null);
      setUsername(null);
      setEmail(null);
    }
  };

  const hasRole = (requiredRoles: UserRole[]): boolean => {
    return userRole ? requiredRoles.includes(userRole) : false;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, userRole, username, email, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};