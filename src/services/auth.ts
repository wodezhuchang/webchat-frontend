import http from './http';
import type {
  RegisterRequest,
  LoginRequest,
  AuthLoginResponse,
  AuthRefreshResponse,
  AuthLogoutResponse,
  User,
  UserSearchResponse
} from '@/types';

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthLoginResponse> => {
    const response = await http.post<AuthLoginResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthLoginResponse> => {
    const response = await http.post<AuthLoginResponse>('/auth/login', data);
    return response.data;
  },

  refreshToken: async (token: string): Promise<AuthRefreshResponse> => {
    const response = await http.post<AuthRefreshResponse>(
      '/auth/refresh',
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  },

  logout: async (token: string): Promise<AuthLogoutResponse> => {
    const response = await http.post<AuthLogoutResponse>(
      '/auth/logout',
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  },

  getCurrentUser: async (token: string): Promise<User> => {
    const response = await http.get<User>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  getUserByUsername: async (username: string): Promise<UserSearchResponse> => {
    const response = await http.get<UserSearchResponse>(`/users/${username}`);
    return response.data;
  }
};
