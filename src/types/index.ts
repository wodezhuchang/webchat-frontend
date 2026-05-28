export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'private' | 'system';
  content: string;
  from?: string;
  to?: string;
  timestamp: Date;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

export interface ChatResponse {
  success: boolean;
  content: string;
  error: string;
}

export interface OnlineUsersResponse {
  success: boolean;
  users: string[];
}

export interface PrivateMessageResponse {
  success: boolean;
  message: string;
}

export interface HistoryResponse {
  success: boolean;
  history: Array<{
    role: string;
    content: string;
  }>;
}

export interface WebSocketMessage {
  type: 'ai' | 'user' | 'users' | 'ping' | 'pong' | 'private' | 'info' | 'error';
  content?: string;
  to?: string;
  from?: string;
  users?: string[];
}

export interface ChatState {
  currentUser: string | null;
  messages: Message[];
  onlineUsers: string[];
  isConnected: boolean;
  selectedUser: string | null;
  isPrivateMode: boolean;
}
