import { api } from './axios';
import { AuthResponse, RegResponse, User } from '../types';

export const authApi = {
  login: (data: any) => api.post<AuthResponse>('/api/v1/login', data),
  register: (data: any) => api.post<RegResponse>('/api/v1/reg', data),
  logout: () => api.post('/api/v1/auth/logout'),
  getProfile: (id: string) => api.get<User>(`/api/v1/profile/${id}`),
  startInterview: (data: any) => api.post('/api/v3/start-interview', data),
};