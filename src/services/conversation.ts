import http from './http';
import type {
  Conversation,
  ConversationListResponse,
  ApiResponse
} from '@/types';

export interface CreateAIConversationResponse {
  success: boolean;
  id: number;
  title: string;
  type: number;
  is_new: boolean;
}

export interface CreatePrivateConversationResponse {
  success: boolean;
  id: number;
  title: string;
  type: number;
  is_new?: boolean;
  target_user_id: number;
  target_username?: string;
  target_nickname?: string;
}

export interface GetConversationResponse {
  success: boolean;
  conversation: Conversation;
}

export const conversationApi = {
  list: async (): Promise<ConversationListResponse> => {
    const response = await http.get<ConversationListResponse>('/conversations');
    return response.data;
  },

  createAI: async (): Promise<CreateAIConversationResponse> => {
    const response = await http.post<CreateAIConversationResponse>('/conversations/ai');
    return response.data;
  },

  getOrCreatePrivate: async (
    targetUserId: number
  ): Promise<CreatePrivateConversationResponse> => {
    const response = await http.post<CreatePrivateConversationResponse>(
      `/conversations/private/${targetUserId}`
    );
    return response.data;
  },

  get: async (conversationId: number): Promise<GetConversationResponse> => {
    const response = await http.get<GetConversationResponse>(`/conversations/${conversationId}`);
    return response.data;
  },

  delete: async (conversationId: number): Promise<ApiResponse> => {
    const response = await http.delete<ApiResponse>(`/conversations/${conversationId}`);
    return response.data;
  },

  updateTitle: async (conversationId: number, title: string): Promise<ApiResponse> => {
    const response = await http.put<ApiResponse>(
      `/conversations/${conversationId}/title`,
      null,
      { params: { title } }
    );
    return response.data;
  }
};
