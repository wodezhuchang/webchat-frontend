import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import { chatWebSocket } from '@/services/websocket';
import type { Message, WebSocketMessage } from '@/types';

interface PrivateChatHistory {
  [username: string]: Message[];
}

export const useChatStore = defineStore('chat', () => {
  const currentUser = ref<string | null>(null);
  const aiMessages = ref<Message[]>([]);
  const privateMessages = ref<PrivateChatHistory>({});
  const onlineUsers = ref<string[]>([]);
  const isConnected = ref<boolean>(false);
  const selectedUser = ref<string | null>(null);
  const isPrivateMode = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const connectionError = ref<string | null>(null);

  let heartbeatTimer: number | null = null;

  const messages = computed(() => {
    if (isPrivateMode.value && selectedUser.value) {
      return privateMessages.value[selectedUser.value] || [];
    }
    return aiMessages.value;
  });

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleWebSocketMessage = (data: WebSocketMessage): void => {
    switch (data.type) {
      case 'ai':
        if (data.content) {
          aiMessages.value.push({
            id: generateId(),
            role: 'assistant',
            content: data.content,
            timestamp: new Date()
          });
        }
        break;

      case 'private':
        if (data.from && data.content) {
          const fromUser = data.from;
          if (!privateMessages.value[fromUser]) {
            privateMessages.value[fromUser] = [];
          }
          privateMessages.value[fromUser].push({
            id: generateId(),
            role: 'private',
            content: data.content,
            from: data.from,
            timestamp: new Date()
          });
        }
        break;

      case 'users':
        if (data.users) {
          onlineUsers.value = data.users.filter(user => user !== currentUser.value);
        }
        break;

      case 'info':
        if (data.content) {
          if (isPrivateMode.value && selectedUser.value) {
            if (!privateMessages.value[selectedUser.value]) {
              privateMessages.value[selectedUser.value] = [];
            }
            privateMessages.value[selectedUser.value].push({
              id: generateId(),
              role: 'system',
              content: data.content,
              timestamp: new Date()
            });
          } else {
            aiMessages.value.push({
              id: generateId(),
              role: 'system',
              content: data.content,
              timestamp: new Date()
            });
          }
        }
        break;

      case 'error':
        if (data.content) {
          if (isPrivateMode.value && selectedUser.value) {
            if (!privateMessages.value[selectedUser.value]) {
              privateMessages.value[selectedUser.value] = [];
            }
            privateMessages.value[selectedUser.value].push({
              id: generateId(),
              role: 'system',
              content: `错误: ${data.content}`,
              timestamp: new Date()
            });
          } else {
            aiMessages.value.push({
              id: generateId(),
              role: 'system',
              content: `错误: ${data.content}`,
              timestamp: new Date()
            });
          }
        }
        break;

      case 'pong':
        console.log('💓 心跳响应收到');
        break;
    }
  };

  const startHeartbeat = (): void => {
    stopHeartbeat();
    heartbeatTimer = window.setInterval(() => {
      if (isConnected.value) {
        console.log('💓 发送心跳');
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

  const login = async (username: string): Promise<boolean> => {
    try {
      const response = await api.login(username);
      if (response.success) {
        currentUser.value = username;
        connectionError.value = null;
        connectWebSocket();
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const connectWebSocket = (): void => {
    if (!currentUser.value) return;

    connectionError.value = null;
    chatWebSocket.connect(currentUser.value);

    chatWebSocket.setOnConnect(() => {
      console.log('✅ WebSocket连接成功，正在初始化...');
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

    chatWebSocket.setOnMessage(handleWebSocketMessage);

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

  const sendMessage = (content: string): void => {
    if (!currentUser.value || !content.trim()) return;

    if (isPrivateMode.value && selectedUser.value) {
      if (!privateMessages.value[selectedUser.value]) {
        privateMessages.value[selectedUser.value] = [];
      }
      privateMessages.value[selectedUser.value].push({
        id: generateId(),
        role: 'private',
        content: content,
        from: currentUser.value,
        to: selectedUser.value,
        timestamp: new Date()
      });
      chatWebSocket.sendPrivate(selectedUser.value, content);
    } else {
      aiMessages.value.push({
        id: generateId(),
        role: 'user',
        content: content,
        timestamp: new Date()
      });
      chatWebSocket.sendAI(content);
    }
  };

  const sendPrivateMessage = async (to: string, content: string): Promise<void> => {
    if (!currentUser.value) return;

    try {
      await api.sendPrivate(currentUser.value, to, content);
    } catch (error) {
      console.error('Failed to send private message:', error);
      throw error;
    }
  };

  const getOnlineUsers = async (): Promise<void> => {
    try {
      const response = await api.getOnlineUsers();
      if (response.success) {
        onlineUsers.value = response.users.filter((user: string) => user !== currentUser.value);
      }
    } catch (error) {
      console.error('Failed to get online users:', error);
    }
  };

  const getHistory = async (): Promise<void> => {
    if (!currentUser.value) return;

    isLoading.value = true;
    try {
      const response = await api.getHistory(currentUser.value);
      if (response.success && response.history) {
        aiMessages.value = response.history.map((msg: { role: string; content: string }, index: number) => ({
          id: generateId() + index,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date()
        }));
      }
    } catch (error) {
      console.error('Failed to get history:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const selectUser = (username: string | null): void => {
    selectedUser.value = username;
    isPrivateMode.value = username !== null;
  };

  const clearMessages = (): void => {
    if (isPrivateMode.value && selectedUser.value) {
      privateMessages.value[selectedUser.value] = [];
    } else {
      aiMessages.value = [];
    }
  };

  const clearAllMessages = (): void => {
    aiMessages.value = [];
    privateMessages.value = {};
  };

  const logout = (): void => {
    disconnectWebSocket();
    currentUser.value = null;
    selectedUser.value = null;
    isPrivateMode.value = false;
    clearAllMessages();
    onlineUsers.value = [];
    connectionError.value = null;
  };

  return {
    currentUser,
    messages,
    onlineUsers,
    isConnected,
    selectedUser,
    isPrivateMode,
    isLoading,
    connectionError,
    login,
    connectWebSocket,
    disconnectWebSocket,
    sendMessage,
    sendPrivateMessage,
    getOnlineUsers,
    getHistory,
    selectUser,
    clearMessages,
    clearAllMessages,
    logout
  };
});
