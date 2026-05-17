import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '../router/AppRouter';
import { RoleGuard } from '../components/RoleGuard';
import { api } from '../api/axios';
import { jwtFor, renderWithAuth } from '../test/helpers';

vi.mock('../api/auth', () => ({
  authApi: { logout: vi.fn(() => Promise.resolve()) }
}));

describe('minimal frontend quality checks', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('protects private routes and renders the login form', async () => {
    renderWithAuth(<AppRouter />, '/profile');
    expect(await screen.findByText(/Welcome Back/i)).toBeInTheDocument();
  });

  it('restores session and checks role-based UI', async () => {
    localStorage.setItem(
      'access_token',
      jwtFor({ id: '1', role: 'admin', username: 'Admin', email: 'admin@test.local' })
    );

    renderWithAuth(
      <RoleGuard requiredRoles={['admin']} fallback={<span>denied</span>}>
        <span>allowed</span>
      </RoleGuard>,
      '/'
    );

    await waitFor(() => expect(screen.getByText('allowed')).toBeInTheDocument());
  });

  it('handles form submit success and server errors', async () => {
    const user = userEvent.setup();
    const token = jwtFor({ id: '7', role: 'candidate', username: 'Test', email: 'user@test.local' });
    const post = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: { access_token: token, refresh_token: 'refresh-token' }
    });
    vi.spyOn(api, 'get').mockResolvedValue({ data: [] });

    renderWithAuth(<AppRouter />, '/login');
    await user.type(await screen.findByLabelText(/Email Address/i), 'user@test.local');
    await user.type(screen.getByLabelText(/Password/i), 'user123456');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => expect(localStorage.getItem('access_token')).toBe(token));
    expect(post).toHaveBeenCalledWith('/api/v1/login', {
      email: 'user@test.local',
      password: 'user123456'
    });

    post.mockRejectedValueOnce({ response: { data: { detail: 'Session expired' } } });
    cleanup();
    renderWithAuth(<AppRouter />, '/login');
    await user.type(await screen.findByLabelText(/Email Address/i), 'bad@test.local');
    await user.type(screen.getByLabelText(/Password/i), 'badpass');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(await screen.findByText('Session expired')).toBeInTheDocument();
  });
});
