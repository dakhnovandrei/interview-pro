import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';

export const jwtFor = (payload: Record<string, unknown>) => {
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replaceAll('=', '');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.sig`;
};

export const renderWithAuth = (ui: React.ReactElement, route = '/') => {
  window.history.pushState({}, 'Test page', route);
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthProvider>
  );
};
