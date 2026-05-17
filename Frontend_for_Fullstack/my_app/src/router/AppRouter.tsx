import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const InterviewPage = lazy(() => import('../pages/InterviewPage').then((module) => ({ default: module.InterviewPage })));
const TemplatesPage = lazy(() => import('../pages/TemplatesPage').then((module) => ({ default: module.TemplatesPage })));
const CreateTemplatePage = lazy(() => import('../pages/CreateTemplatePage').then((module) => ({ default: module.CreateTemplatePage })));
const AdminPage = lazy(() => import('../pages/AdminPage').then((module) => ({ default: module.AdminPage })));
const HomePage = lazy(() => import('../pages/HomePage').then((module) => ({ default: module.HomePage })));
const LandingPage = lazy(() => import('../pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const PublicTemplatesPage = lazy(() => import('../pages/PublicTemplatesPage').then((module) => ({ default: module.PublicTemplatesPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  // Simple check for token presence to avoid flickering on page refresh
  const hasToken = localStorage.getItem('access_token');
  
  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const AppRouter = () => {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600">
        Loading...
      </div>
    }>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/interview-templates" element={<PublicTemplatesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/interview/:sessionId" element={
          <ProtectedRoute>
            <InterviewPage />
          </ProtectedRoute>
        } />
        <Route path="/templates" element={
          <ProtectedRoute>
            <TemplatesPage />
          </ProtectedRoute>
        } />
        <Route path="/templates/create" element={
          <ProtectedRoute>
            <CreateTemplatePage />
          </ProtectedRoute>
        } />
        <Route path="/template/create" element={<Navigate to="/templates/create" replace />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
