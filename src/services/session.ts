import http from './http';
import type {
  SessionCreateRequest,
  SessionUpdateRequest,
  SessionResponse,
  SessionListResponse,
  ApiResponse
} from '@/types';

export const sessionApi = {
  list: async (isActive?: number): Promise<SessionListResponse> => {
    const params: Record<string, unknown> = {};
    if (isActive !== undefined) {
      params.is_active = isActive;
    }
    const response = await http.get<SessionListResponse>('/sessions', { params });
    return response.data;
  },

  get: async (sessionId: number): Promise<SessionResponse> => {
    const response = await http.get<SessionResponse>(`/sessions/${sessionId}`);
    return response.data;
  },

  create: async (data: SessionCreateRequest): Promise<SessionResponse> => {
    const response = await http.post<SessionResponse>('/sessions', data);
    return response.data;
  },

  getOrCreatePrivate: async (
    targetUserId: number,
    targetUsername?: string
  ): Promise<SessionResponse> => {
    const params: Record<string, unknown> = {
      target_user_id: targetUserId
    };
    if (targetUsername) {
      params.target_username = targetUsername;
    }
    const response = await http.post<SessionResponse>(
      '/sessions/private',
      null,
      { params }
    );
    return response.data;
  },

  update: async (sessionId: number, data: SessionUpdateRequest): Promise<SessionResponse> => {
    const response = await http.put<SessionResponse>(`/sessions/${sessionId}`, data);
    return response.data;
  },

  delete: async (sessionId: number): Promise<ApiResponse> => {
    const response = await http.delete<ApiResponse>(`/sessions/${sessionId}`);
    return response.data;
  }
};
