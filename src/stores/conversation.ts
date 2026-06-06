import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Conversation, Message as LocalMessage, ChatMessage } from '@/types';
import { conversationApi } from '@/services/conversation';
import { messageApi } from '@/services/message';

const SENDER_TYPE = {
  USER: 1,
  AI: 2,
  SYSTEM: 3
} as const;

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Conversation[]>([]);
  const currentConversationId = ref<number | null>(null);
  const currentConversation = ref<Conversation | null>(null);
  const messages = ref<LocalMessage[]>([]);
  const isLoading = ref<boolean>(false);
  const isLoadingMessages = ref<boolean>(false);
  const error = ref<string | null>(null);
  const hasMore = ref<boolean>(true);
  const currentPage = ref<number>(1);
  const onlineUsersMap = ref<Record<string, boolean>>({});
  const currentUserId = ref<number | null>(null);

  const setCurrentUserId = (userId: number | null): void => {
    currentUserId.value = userId;
  };

  const aiConversations = computed(() =>
    conversations.value.filter(c => c.type === 1)
  );

  const privateConversations = computed(() =>
    conversations.value.filter(c => c.type === 2)
  );

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const convertDbMessageToLocal = (
    msg: ChatMessage,
    userId: number | null = null
  ): LocalMessage => {
    const uid = userId ?? currentUserId.value;
    let role: LocalMessage['role'];
    let from: string | undefined;
    let to: string | undefined;

    if (msg.sender_type === SENDER_TYPE.USER) {
      role = currentConversation.value?.type === 2 ? 'private' : 'user';
      if (currentConversation.value?.type === 2) {
        const conv = currentConversation.value;
        if (uid !== null && msg.sender_id === uid) {
          from = undefined;
          to = conv.target_username;
        } else if (conv.target_username) {
          from = conv.target_username;
          to = undefined;
        }
      }
    } else if (msg.sender_type === SENDER_TYPE.AI) {
      role = 'assistant';
    } else {
      role = 'system';
    }

    return {
      id: msg.id.toString(),
      role,
      content: msg.content,
      from,
      to,
      timestamp: new Date(msg.created_at)
    };
  };

  const loadConversations = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await conversationApi.list();
      conversations.value = response.conversations.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } catch (err: any) {
      error.value = err?.message || '加载会话列表失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateConversationOnlineStatus = (username: string, isOnline: boolean): void => {
    onlineUsersMap.value[username] = isOnline;

    for (const conv of conversations.value) {
      if (conv.type === 2 && conv.target_username === username) {
        conv.is_online = isOnline;
      }
    }
  };

  const refreshOnlineStatusFromList = (usernames: string[]): void => {
    const onlineSet = new Set(usernames);

    for (const conv of conversations.value) {
      if (conv.type === 2 && conv.target_username) {
        conv.is_online = onlineSet.has(conv.target_username);
      }
    }
  };

  const createAIConversation = async (): Promise<Conversation> => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await conversationApi.createAI();
      const newConv: Conversation = {
        id: response.id,
        type: response.type,
        title: response.title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      conversations.value.unshift(newConv);
      return newConv;
    } catch (err: any) {
      error.value = err?.message || '创建对话失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getOrCreatePrivateConversation = async (
    targetUserId: number
  ): Promise<Conversation> => {
    const existing = conversations.value.find(
      c => c.type === 2 && c.target_user_id === targetUserId
    );

    if (existing) {
      return existing;
    }

    try {
      const response = await conversationApi.getOrCreatePrivate(targetUserId);
      const newConv: Conversation = {
        id: response.id,
        type: response.type,
        title: response.title,
        target_user_id: response.target_user_id,
        target_username: response.target_username,
        target_nickname: response.target_nickname,
        is_online: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      conversations.value.unshift(newConv);
      return newConv;
    } catch (err: any) {
      error.value = err?.message || '获取私聊会话失败';
      throw err;
    }
  };

  const selectConversation = async (conversationId: number | null): Promise<void> => {
    currentConversationId.value = conversationId;

    if (conversationId === null) {
      currentConversation.value = null;
      messages.value = [];
      return;
    }

    const conv = conversations.value.find(c => c.id === conversationId);
    if (conv) {
      currentConversation.value = conv;
      await loadMessages(conversationId);
    }
  };

  const loadMessages = async (
    conversationId: number,
    userId: number | null = null
  ): Promise<void> => {
    isLoadingMessages.value = true;
    currentPage.value = 1;
    hasMore.value = true;
    messages.value = [];

    const uid = userId ?? currentUserId.value;

    try {
      const response = await messageApi.getByConversation(conversationId, {
        page: 1,
        limit: 50
      });

      const sortedMessages = [...response.messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      messages.value = sortedMessages.map(msg => {
        const isPrivate = currentConversation.value?.type === 2;
        if (isPrivate) {
          const conv = currentConversation.value;
          let from: string | undefined;
          let to: string | undefined;
          if (conv) {
            if (uid !== null && msg.sender_id === uid) {
              to = conv.target_username;
            } else if (conv.target_username) {
              from = conv.target_username;
            }
          }
          return {
            id: msg.id.toString(),
            role: 'private',
            content: msg.content,
            from,
            to,
            timestamp: new Date(msg.created_at)
          };
        } else {
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
        }
      });

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

  const addReceivedMessage = (
    message: LocalMessage,
    conversationId?: number
  ): void => {
    if (currentConversationId.value === conversationId) {
      messages.value.push(message);
    }

    if (conversationId) {
      const conv = conversations.value.find(c => c.id === conversationId);
      if (conv) {
        conv.last_message = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
        conv.last_message_time = message.timestamp.toISOString();
        conv.updated_at = message.timestamp.toISOString();
      }
    }
  };

  const updateConversationTitle = async (
    conversationId: number,
    title: string
  ): Promise<void> => {
    try {
      await conversationApi.updateTitle(conversationId, title);
      const conv = conversations.value.find(c => c.id === conversationId);
      if (conv) {
        conv.title = title;
      }
      if (currentConversation.value?.id === conversationId) {
        currentConversation.value.title = title;
      }
    } catch (err) {
      console.error('更新会话标题失败:', err);
    }
  };

  const deleteConversation = async (conversationId: number): Promise<void> => {
    try {
      await conversationApi.delete(conversationId);
      conversations.value = conversations.value.filter(c => c.id !== conversationId);
      if (currentConversationId.value === conversationId) {
        currentConversationId.value = null;
        currentConversation.value = null;
        messages.value = [];
      }
    } catch (err) {
      console.error('删除会话失败:', err);
      throw err;
    }
  };

  const deleteMessage = async (messageId: number): Promise<void> => {
    try {
      await messageApi.delete(messageId);
      messages.value = messages.value.filter(m => m.id !== messageId.toString());
    } catch (err) {
      console.error('删除消息失败:', err);
      throw err;
    }
  };

  const clearAll = (): void => {
    conversations.value = [];
    currentConversationId.value = null;
    currentConversation.value = null;
    messages.value = [];
    isLoading.value = false;
    isLoadingMessages.value = false;
    error.value = null;
    hasMore.value = true;
    currentPage.value = 1;
  };

  const getConversationByTargetUser = (targetUserId: number): Conversation | undefined => {
    return conversations.value.find(
      c => c.type === 2 && c.target_user_id === targetUserId
    );
  };

  const getConversationByTargetUsername = (username: string): Conversation | undefined => {
    return conversations.value.find(
      c => c.type === 2 && c.target_username === username
    );
  };

  return {
    conversations,
    currentConversationId,
    currentConversation,
    messages,
    isLoading,
    isLoadingMessages,
    error,
    hasMore,
    currentPage,
    currentUserId,
    setCurrentUserId,
    aiConversations,
    privateConversations,
    loadConversations,
    updateConversationOnlineStatus,
    refreshOnlineStatusFromList,
    createAIConversation,
    getOrCreatePrivateConversation,
    selectConversation,
    loadMessages,
    addLocalMessage,
    addReceivedMessage,
    updateConversationTitle,
    deleteConversation,
    deleteMessage,
    clearAll,
    getConversationByTargetUser,
    getConversationByTargetUsername
  };
});
