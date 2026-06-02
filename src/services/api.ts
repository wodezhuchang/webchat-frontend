import type {
  LoginResponse,
  ChatResponse,
  OnlineUsersResponse,
  PrivateMessageResponse,
  HistoryResponse
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async login(username: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });
    return response.json();
  },

  async chat(username: string, message: string): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, message }),
    });
    return response.json();
  },

  async getOnlineUsers(): Promise<OnlineUsersResponse> {
    const response = await fetch(`${API_BASE_URL}/users`);
    return response.json();
  },

  async sendPrivate(from: string, to: string, content: string): Promise<PrivateMessageResponse> {
    const response = await fetch(`${API_BASE_URL}/private`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from_user: from, to_user: to, content }),
    });
    return response.json();
  },

  async getHistory(username: string): Promise<HistoryResponse> {
    const response = await fetch(`${API_BASE_URL}/history/${username}`);
    return response.json();
  }
};
