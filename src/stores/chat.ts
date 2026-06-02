import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { chatWebSocket } from '@/services/websocket';
import type { Message, WebSocketMessage } from '@/types';

export const useChatStore = defineStore('chat', () => {
  const currentUser = ref<string | null>(null);
  const currentUserId = ref<number | null>(null);
  const onlineUsers = ref<string[]>([]);
  const isConnected = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const connectionError = ref<string | null>(null);

  let heartbeatTimer: number | null = null;

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const filterOnlineUsers = (users: string[]): string[] => {
    const currentUsername = currentUser.value;
    return users.filter(user => user !== currentUsername);
  };

  const handleWebSocketMessage = (data: WebSocketMessage): Message | null => {
    switch (data.type) {
      case 'ai':
        if (data.content) {
          return {
            id: data.message_id?.toString() || generateId(),
            role: 'assistant',
            content: data.content,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
          };
        }
        break;

      case 'private':
        if (data.from && data.content) {
          return {
            id: data.message_id?.toString() || generateId(),
            role: 'private',
            content: data.content,
            from: data.from,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
          };
        }
        break;

      case 'users':
        if (data.users) {
          onlineUsers.value = filterOnlineUsers(data.users);
        }
        break;

      case 'info':
        if (data.content) {
          return {
            id: generateId(),
            role: 'system',
            content: data.content,
            timestamp: new Date()
          };
        }
        break;

      case 'error':
        if (data.content) {
          return {
            id: generateId(),
            role: 'system',
            content: `错误: ${data.content}`,
            timestamp: new Date()
          };
        }
        break;

      case 'pong':
        console.log('💓 心跳响应收到');
        break;
    }
    return null;
  };

  const startHeartbeat = (): void => {
    stopHeartbeat();
    heartbeatTimer = window.setInterval(() => {
      if (isConnected.value) {
        chatWebSocket.sendPing();
      }
    }, 10000);
  };

  const stopHeartbeat = (): void => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const setCurrentUser = (username: string, userId?: number): void => {
    currentUser.value = username;
    if (userId !== undefined) {
      currentUserId.value = userId;
    }
    connectionError.value = null;
  };

  const connectWebSocket = (): void => {
    if (!currentUser.value) {
      console.error('❌ 无法连接 WebSocket: 未设置用户名');
      return;
    }

    connectionError.value = null;
    chatWebSocket.connect(currentUser.value);

    chatWebSocket.setOnConnect(() => {
      console.log('✅ WebSocket连接成功');
      isConnected.value = true;
      connectionError.value = null;
      startHeartbeat();
      chatWebSocket.sendPing();
      setTimeout(() => {
        chatWebSocket.requestOnlineUsers();
      }, 500);
    });

    chatWebSocket.setOnDisconnect(() => {
      console.log('🔌 WebSocket断开');
      isConnected.value = false;
      stopHeartbeat();
    });

    chatWebSocket.setOnError((error, message) => {
      console.error('❌ WebSocket错误:', message);
      isConnected.value = false;
      connectionError.value = message;
    });
  };

  const disconnectWebSocket = (): void => {
    chatWebSocket.disconnect();
    isConnected.value = false;
    stopHeartbeat();
  };

  const sendMessage = (
    content: string,
    options: {
      conversationId?: number;
      targetUsername?: string;
      isPrivate?: boolean;
    } = {}
  ): void => {
    const { conversationId, targetUsername, isPrivate = false } = options;

    if (!currentUser.value || !content.trim()) return;

    if (isPrivate && targetUsername) {
      chatWebSocket.sendPrivate(targetUsername, content, conversationId);
    } else {
      chatWebSocket.sendAI(content, conversationId);
    }
  };

  const sendAIMessage = (content: string, conversationId?: number): void => {
    chatWebSocket.sendAI(content, conversationId);
  };

  const sendPrivateMessage = (
    targetUsername: string,
    content: string,
    conversationId?: number
  ): void => {
    chatWebSocket.sendPrivate(targetUsername, content, conversationId);
  };

  const refreshOnlineUsers = (): void => {
    if (isConnected.value) {
      chatWebSocket.requestOnlineUsers();
    }
  };

  const setOnMessageCallback = (
    callback: (data: WebSocketMessage, message: Message | null) => void
  ): void => {
    chatWebSocket.setOnMessage((data: WebSocketMessage) => {
      const message = handleWebSocketMessage(data);
      callback(data, message);
    });
  };

  const logout = (): void => {
    disconnectWebSocket();
    currentUser.value = null;
    currentUserId.value = null;
    onlineUsers.value = [];
    connectionError.value = null;
  };

  return {
    currentUser,
    currentUserId,
    onlineUsers,
    isConnected,
    isLoading,
    connectionError,
    setCurrentUser,
    connectWebSocket,
    disconnectWebSocket,
    sendMessage,
    sendAIMessage,
    sendPrivateMessage,
    refreshOnlineUsers,
    setOnMessageCallback,
    logout
  };
});
