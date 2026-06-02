export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'private' | 'system';
  content: string;
  from?: string;
  to?: string;
  timestamp: Date;
}

export interface WebSocketMessage {
  type: 'ai' | 'user' | 'users' | 'ping' | 'pong' | 'private' | 'info' | 'error';
  content?: string;
  to?: string;
  from?: string;
  from_id?: number;
  users?: string[];
  conversation_id?: number;
  message_id?: number;
  timestamp?: string;
}

export interface ChatState {
  currentUser: string | null;
  messages: Message[];
  onlineUsers: string[];
  isConnected: boolean;
  selectedUser: string | null;
  isPrivateMode: boolean;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string | null;
  status: number;
  created_at: string;
}

export interface ChatSession {
  id: number;
  user_id: number;
  title: string;
  session_type: number;
  target_user_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  type: number;
  title: string;
  target_user_id?: number;
  target_username?: string;
  target_nickname?: string;
  is_online?: boolean;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationListResponse {
  success: boolean;
  conversations: Conversation[];
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_type: number;
  sender_id: number | null;
  content: string;
  message_type: number;
  media_url: string | null;
  status: number;
  created_at: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirm_password: string;
  nickname: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthLoginResponse {
  success: boolean;
  message: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AuthRefreshResponse {
  success: boolean;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthLogoutResponse {
  success: boolean;
  message: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface SessionCreateRequest {
  title: string;
  session_type: number;
  target_user_id?: number;
}

export interface SessionUpdateRequest {
  title?: string;
}

export interface SessionResponse {
  id: number;
  user_id: number;
  title: string;
  session_type: number;
  target_user_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionListResponse {
  success: boolean;
  sessions: SessionResponse[];
}

export interface MessageListResponse {
  success: boolean;
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface MessageResponse {
  id: number;
  conversation_id: number;
  sender_type: number;
  sender_id: number | null;
  content: string;
  message_type: number;
  media_url: string | null;
  status: number;
  created_at: string;
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

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'chat_access_token',
  REFRESH_TOKEN: 'chat_refresh_token',
  TOKEN_EXPIRES_AT: 'chat_token_expires_at',
  USER_INFO: 'chat_user_info',
  CURRENT_SESSION: 'chat_current_session'
} as const;

export interface UserSearchResponse {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
  status: number;
  created_at?: string;
}

export interface PrivateSessionResponse {
  success: boolean;
  session: ChatSession;
  is_new?: boolean;
}
