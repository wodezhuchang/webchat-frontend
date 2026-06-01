import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ChatSession, ChatMessage, Message as LocalMessage } from '@/types';
import { sessionApi } from '@/services/session';
import { messageApi } from '@/services/message';

const SENDER_TYPE = {
  USER: 1,
  AI: 2,
  SYSTEM: 3
} as const;

export const useSessionStore = defineStore('session', () => {
  const sessions = ref<ChatSession[]>([]);
  const currentSessionId = ref<number | null>(null);
  const currentSession = ref<ChatSession | null>(null);
  const messages = ref<LocalMessage[]>([]);
  const isLoading = ref<boolean>(false);
  const isLoadingMessages = ref<boolean>(false);
  const error = ref<string | null>(null);
  const hasMore = ref<boolean>(true);
  const currentPage = ref<number>(1);

  const aiSessions = computed(() =>
    sessions.value.filter(s => s.session_type === 1)
  );

  const privateSessions = computed(() =>
    sessions.value.filter(s => s.session_type === 2)
  );

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const convertDbMessageToLocal = (msg: ChatMessage): LocalMessage => {
    let role: LocalMessage['role'];
    if (msg.sender_type === SENDER_TYPE.USER) {
      role = 'user';
    } else if (msg.sender_type === SENDER_TYPE.AI) {
      role = 'assistant';
    } else {
      role = 'system';
    }

    return {
      id: msg.id.toString(),
      role,
      content: msg.content,
      timestamp: new Date(msg.created_at)
    };
  };

  const loadSessions = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await sessionApi.list(1);
      sessions.value = response.sessions.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } catch (err: any) {
      error.value = err?.message || '加载会话列表失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createAISession = async (title: string = '新对话'): Promise<ChatSession> => {
    isLoading.value = true;
    error.value = null;

    try {
      const session = await sessionApi.create({
        title,
        session_type: 1
      });
      sessions.value.unshift(session);
      return session;
    } catch (err: any) {
      error.value = err?.message || '创建会话失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createPrivateSession = async (
    targetUserId: number,
    title: string
  ): Promise<ChatSession> => {
    isLoading.value = true;
    error.value = null;

    try {
      const session = await sessionApi.create({
        title,
        session_type: 2,
        target_user_id: targetUserId
      });
      sessions.value.unshift(session);
      return session;
    } catch (err: any) {
      error.value = err?.message || '创建私聊会话失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const selectSession = async (sessionId: number | null): Promise<void> => {
    currentSessionId.value = sessionId;

    if (sessionId === null) {
      currentSession.value = null;
      messages.value = [];
      return;
    }

    const session = sessions.value.find(s => s.id === sessionId);
    if (session) {
      currentSession.value = session;
      await loadMessages(sessionId);
    }
  };

  const loadMessages = async (sessionId: number): Promise<void> => {
    isLoadingMessages.value = true;
    currentPage.value = 1;
    hasMore.value = true;
    messages.value = [];

    try {
      const response = await messageApi.getBySession(sessionId, {
        page: 1,
        limit: 50
      });

      const sortedMessages = [...response.messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      messages.value = sortedMessages.map(convertDbMessageToLocal);
      hasMore.value = response.has_more;
    } catch (err: any) {
      console.error('加载消息失败:', err);
    } finally {
      isLoadingMessages.value = false;
    }
  };

  const addLocalMessage = (message: LocalMessage): void => {
    messages.value.push(message);
  };

  const updateSessionTitle = async (
    sessionId: number,
    title: string
  ): Promise<void> => {
    try {
      const updated = await sessionApi.update(sessionId, { title });
      const index = sessions.value.findIndex(s => s.id === sessionId);
      if (index !== -1) {
        sessions.value[index] = updated;
      }
      if (currentSession.value?.id === sessionId) {
        currentSession.value = updated;
      }
    } catch (err) {
      console.error('更新会话标题失败:', err);
    }
  };

  const deleteSession = async (sessionId: number): Promise<void> => {
    try {
      await sessionApi.delete(sessionId);
      sessions.value = sessions.value.filter(s => s.id !== sessionId);
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = null;
        currentSession.value = null;
        messages.value = [];
      }
    } catch (err) {
      console.error('删除会话失败:', err);
      throw err;
    }
  };

  const clearAll = (): void => {
    sessions.value = [];
    currentSessionId.value = null;
    currentSession.value = null;
    messages.value = [];
    isLoading.value = false;
    isLoadingMessages.value = false;
    error.value = null;
    hasMore.value = true;
    currentPage.value = 1;
  };

  const getSessionByTargetUser = (targetUserId: number): ChatSession | undefined => {
    return sessions.value.find(
      s => s.session_type === 2 && s.target_user_id === targetUserId
    );
  };

  return {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    isLoading,
    isLoadingMessages,
    error,
    hasMore,
    currentPage,
    aiSessions,
    privateSessions,
    loadSessions,
    createAISession,
    createPrivateSession,
    selectSession,
    loadMessages,
    addLocalMessage,
    updateSessionTitle,
    deleteSession,
    clearAll,
    getSessionByTargetUser
  };
});
