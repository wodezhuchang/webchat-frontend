import http from './http';
import type {
  MessageListResponse,
  ApiResponse
} from '@/types';

export const messageApi = {
  getByConversation: async (
    conversationId: number,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<MessageListResponse> => {
    const { page = 1, limit = 50 } = options || {};
    const response = await http.get<MessageListResponse>(
      `/messages/conversation/${conversationId}`,
      {
        params: { page, limit }
      }
    );
    return response.data;
  },

  delete: async (messageId: number): Promise<ApiResponse> => {
    const response = await http.delete<ApiResponse>(`/messages/${messageId}`);
    return response.data;
  },

  recall: async (messageId: number): Promise<ApiResponse> => {
    const response = await http.put<ApiResponse>(`/messages/${messageId}/recall`);
    return response.data;
  }
};
