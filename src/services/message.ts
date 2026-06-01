import http from './http';
import type {
  MessageListResponse,
  ApiResponse
} from '@/types';

export const messageApi = {
  getBySession: async (
    sessionId: number,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<MessageListResponse> => {
    const { page = 1, limit = 20 } = options || {};
    const response = await http.get<MessageListResponse>(
      `/messages/session/${sessionId}`,
      {
        params: { page, limit }
      }
    );
    return response.data;
  },

  recall: async (messageId: number): Promise<ApiResponse> => {
    const response = await http.delete<ApiResponse>(`/messages/${messageId}`);
    return response.data;
  }
};
