import client from './client';
import { AuthResponse, User } from '../types';

export const authApi = {
  register: (username: string, email: string, password: string) =>
    client.post<{ user: User; message: string }>('/auth/register', { username, email, password }),

  login: (email: string, password: string) =>
    client.post<AuthResponse>('/auth/login', { email, password }),

  getMe: () => client.get<{ user: User }>('/auth/me'),

  changePassword: (old_password: string, new_password: string) =>
    client.put('/auth/password', { old_password, new_password }),

  refresh: (refreshToken: string) =>
    client.post<{ access_token: string }>('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    }),
};
